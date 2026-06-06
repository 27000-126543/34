const database = require('../config/database');

const getDb = () => database.db;

const DailyReport = {
  create: (restaurantId, date, data) => {
    const db = getDb();
    const result = db.prepare(`
      INSERT INTO daily_reports (
        restaurant_id, date, total_revenue, total_cost, customer_count,
        satisfaction_avg, popular_dishes_json, ingredient_costs_json, satisfaction_trend_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      restaurantId,
      date,
      data.total_revenue || 0,
      data.total_cost || 0,
      data.customer_count || 0,
      data.satisfaction_avg || 0,
      JSON.stringify(data.popular_dishes_json || []),
      JSON.stringify(data.ingredient_costs_json || []),
      JSON.stringify(data.satisfaction_trend_json || [])
    );
    return DailyReport.findById(result.lastInsertRowid);
  },

  findById: (id) => {
    const db = getDb();
    const report = db.prepare('SELECT * FROM daily_reports WHERE id = ?').get(id);
    if (report) {
      report.popular_dishes_json = JSON.parse(report.popular_dishes_json);
      report.ingredient_costs_json = JSON.parse(report.ingredient_costs_json);
      report.satisfaction_trend_json = JSON.parse(report.satisfaction_trend_json);
    }
    return report;
  },

  findByRestaurantId: (restaurantId, limit = 30) => {
    const db = getDb();
    const reports = db.prepare('SELECT * FROM daily_reports WHERE restaurant_id = ? ORDER BY date DESC LIMIT ?').all(restaurantId, limit);
    return reports.map(report => ({
      ...report,
      popular_dishes_json: JSON.parse(report.popular_dishes_json),
      ingredient_costs_json: JSON.parse(report.ingredient_costs_json),
      satisfaction_trend_json: JSON.parse(report.satisfaction_trend_json)
    }));
  },

  findByDateRange: (restaurantId, startDate, endDate) => {
    const db = getDb();
    const reports = db.prepare('SELECT * FROM daily_reports WHERE restaurant_id = ? AND date BETWEEN ? AND ? ORDER BY date ASC').all(restaurantId, startDate, endDate);
    return reports.map(report => ({
      ...report,
      popular_dishes_json: JSON.parse(report.popular_dishes_json),
      ingredient_costs_json: JSON.parse(report.ingredient_costs_json),
      satisfaction_trend_json: JSON.parse(report.satisfaction_trend_json)
    }));
  },

  findByRestaurantAndDate: (restaurantId, date) => {
    const db = getDb();
    const report = db.prepare('SELECT * FROM daily_reports WHERE restaurant_id = ? AND date = ?').get(restaurantId, date);
    if (report) {
      report.popular_dishes_json = JSON.parse(report.popular_dishes_json);
      report.ingredient_costs_json = JSON.parse(report.ingredient_costs_json);
      report.satisfaction_trend_json = JSON.parse(report.satisfaction_trend_json);
    }
    return report;
  },

  update: (id, data) => {
    const db = getDb();
    const fields = [];
    const values = [];
    if (data.total_revenue !== undefined) { fields.push('total_revenue = ?'); values.push(data.total_revenue); }
    if (data.total_cost !== undefined) { fields.push('total_cost = ?'); values.push(data.total_cost); }
    if (data.customer_count !== undefined) { fields.push('customer_count = ?'); values.push(data.customer_count); }
    if (data.satisfaction_avg !== undefined) { fields.push('satisfaction_avg = ?'); values.push(data.satisfaction_avg); }
    if (data.popular_dishes_json !== undefined) { fields.push('popular_dishes_json = ?'); values.push(JSON.stringify(data.popular_dishes_json)); }
    if (data.ingredient_costs_json !== undefined) { fields.push('ingredient_costs_json = ?'); values.push(JSON.stringify(data.ingredient_costs_json)); }
    if (data.satisfaction_trend_json !== undefined) { fields.push('satisfaction_trend_json = ?'); values.push(JSON.stringify(data.satisfaction_trend_json)); }
    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE daily_reports SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
    return DailyReport.findById(id);
  },

  getWeeklySummary: (restaurantId, endDate) => {
    const db = getDb();
    const reports = db.prepare(`
      SELECT * FROM daily_reports
      WHERE restaurant_id = ? AND date >= date(?, '-6 days') AND date <= ?
      ORDER BY date ASC
    `).all(restaurantId, endDate, endDate);

    const parsedReports = reports.map(report => ({
      ...report,
      popular_dishes_json: JSON.parse(report.popular_dishes_json),
      ingredient_costs_json: JSON.parse(report.ingredient_costs_json),
      satisfaction_trend_json: JSON.parse(report.satisfaction_trend_json)
    }));

    const totalRevenue = parsedReports.reduce((sum, r) => sum + r.total_revenue, 0);
    const totalCost = parsedReports.reduce((sum, r) => sum + r.total_cost, 0);
    const totalCustomers = parsedReports.reduce((sum, r) => sum + r.customer_count, 0);
    const avgSatisfaction = parsedReports.length > 0
      ? parsedReports.reduce((sum, r) => sum + r.satisfaction_avg, 0) / parsedReports.length
      : 0;

    return {
      reports: parsedReports,
      summary: {
        total_revenue: totalRevenue,
        total_cost: totalCost,
        net_profit: totalRevenue - totalCost,
        total_customers: totalCustomers,
        avg_satisfaction: Math.round(avgSatisfaction * 100) / 100,
        report_count: parsedReports.length
      }
    };
  }
};

module.exports = DailyReport;
