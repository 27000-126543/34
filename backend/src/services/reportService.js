const DailyReport = require('../models/DailyReport');
const Restaurant = require('../models/Restaurant');
const Dish = require('../models/Dish');
const Inventory = require('../models/Inventory');
const Ingredient = require('../models/Ingredient');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const reportService = {
  generateDailyReport: (restaurantId, date = null) => {
    const reportDate = date || new Date().toISOString().split('T')[0];
    const existing = DailyReport.findByRestaurantAndDate(restaurantId, reportDate);
    if (existing) return existing;

    const dishes = Dish.getPopularByRestaurant(restaurantId, 5);
    const inventory = Inventory.findByRestaurantId(restaurantId);

    const popularDishes = dishes.map(d => ({
      dish_id: d.id,
      name: d.name,
      sales_count: d.sales_count,
      rating: d.rating,
      revenue: d.sales_count * d.base_price
    }));

    const ingredientCosts = inventory.slice(0, 5).map(inv => ({
      ingredient_id: inv.ingredient_id,
      name: inv.ingredient_name,
      quantity: inv.quantity,
      total_cost: inv.quantity * inv.current_price
    }));

    const totalRevenue = popularDishes.reduce((sum, d) => sum + d.revenue, 0);
    const totalCost = ingredientCosts.reduce((sum, c) => sum + c.total_cost, 0);
    const customerCount = Math.floor(popularDishes.reduce((sum, d) => sum + d.sales_count, 0) * 1.5);
    const avgSatisfaction = dishes.length > 0
      ? dishes.reduce((sum, d) => sum + d.rating, 0) / dishes.length
      : 0;

    const satisfactionTrend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      satisfactionTrend.push({
        date: d.toISOString().split('T')[0],
        satisfaction: Math.round((3.5 + Math.random() * 1.5) * 10) / 10
      });
    }

    return DailyReport.create(restaurantId, reportDate, {
      total_revenue: totalRevenue,
      total_cost: totalCost,
      customer_count: customerCount,
      satisfaction_avg: Math.round(avgSatisfaction * 10) / 10,
      popular_dishes_json: popularDishes,
      ingredient_costs_json: ingredientCosts,
      satisfaction_trend_json: satisfactionTrend
    });
  },

  getWeeklyReport: (restaurantId, endDate = null) => {
    const date = endDate || new Date().toISOString().split('T')[0];
    return DailyReport.getWeeklySummary(restaurantId, date);
  },

  getReportsByDateRange: (restaurantId, startDate, endDate) => {
    return DailyReport.findByDateRange(restaurantId, startDate, endDate);
  },

  getRadarChartData: (restaurantId) => {
    const restaurant = Restaurant.findById(restaurantId);
    if (!restaurant) return null;

    const dishes = Dish.findByRestaurantId(restaurantId);
    const avgRating = dishes.length > 0
      ? dishes.reduce((sum, d) => sum + d.rating, 0) / dishes.length
      : 0;
    const totalSales = dishes.reduce((sum, d) => sum + d.sales_count, 0);
    const rareCount = dishes.filter(d => d.is_rare).length;

    const data = {
      taste: avgRating * 20,
      popularity: Math.min(100, totalSales / 10),
      rarity: Math.min(100, rareCount * 25),
      profit: Math.min(100, restaurant.total_profit / 5000),
      service: Math.min(100, restaurant.level * 20),
      decor: Math.min(100, restaurant.level * 18)
    };

    return {
      labels: ['口味', '人气', '稀有度', '盈利', '服务', '装潢'],
      datasets: [{
        label: restaurant.name,
        data: [data.taste, data.popularity, data.rarity, data.profit, data.service, data.decor],
        backgroundColor: 'rgba(54, 162, 235, 0.2)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(54, 162, 235, 1)'
      }]
    };
  },

  getLineChartData: (restaurantId) => {
    const weekly = reportService.getWeeklyReport(restaurantId);
    const reports = weekly.reports;

    const labels = reports.map(r => r.date);
    const revenueData = reports.map(r => r.total_revenue);
    const satisfactionData = reports.map(r => r.satisfaction_avg * 20);

    return {
      labels: labels,
      datasets: [
        {
          label: '收入',
          data: revenueData,
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)'
        },
        {
          label: '满意度 (x20)',
          data: satisfactionData,
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)'
        }
      ]
    };
  },

  drawRadarInPDF: (doc, x, y, size, data) => {
    const centerX = x + size / 2;
    const centerY = y + size / 2;
    const radius = size / 2 - 20;
    const sides = data.labels.length;
    const angleStep = (Math.PI * 2) / sides;

    doc.save();

    for (let level = 1; level <= 5; level++) {
      const r = radius * (level / 5);
      doc.circle(centerX, centerY, r).strokeColor('#ddd').lineWidth(0.5).stroke();
    }

    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const x1 = centerX + Math.cos(angle) * radius;
      const y1 = centerY + Math.sin(angle) * radius;
      doc.moveTo(centerX, centerY).lineTo(x1, y1).strokeColor('#ccc').lineWidth(0.5).stroke();
    }

    const dataset = data.datasets[0];
    doc.moveTo(
      centerX + Math.cos(-Math.PI / 2) * radius * (dataset.data[0] / 100),
      centerY + Math.sin(-Math.PI / 2) * radius * (dataset.data[0] / 100)
    );

    for (let i = 1; i < sides; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const value = dataset.data[i] / 100;
      doc.lineTo(
        centerX + Math.cos(angle) * radius * value,
        centerY + Math.sin(angle) * radius * value
      );
    }

    doc.closePath()
      .fillColor('rgba(54, 162, 235, 0.3)').fill()
      .strokeColor('rgba(54, 162, 235, 1)').lineWidth(2).stroke();

    for (let i = 0; i < sides; i++) {
      const angle = i * angleStep - Math.PI / 2;
      const labelX = centerX + Math.cos(angle) * (radius + 15);
      const labelY = centerY + Math.sin(angle) * (radius + 15);
      doc.fontSize(10).fillColor('#333').text(data.labels[i], labelX - 20, labelY - 6, { width: 40, align: 'center' });
    }

    doc.restore();
  },

  drawLineChartInPDF: (doc, x, y, width, height, data) => {
    const padding = { top: 30, right: 30, bottom: 40, left: 50 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    doc.save();

    const colors = ['rgba(75, 192, 192, 1)', 'rgba(255, 99, 132, 1)'];

    let maxValue = 0;
    for (const ds of data.datasets) {
      const dsMax = Math.max(...ds.data);
      if (dsMax > maxValue) maxValue = dsMax;
    }
    maxValue = Math.ceil(maxValue / 100) * 100 || 100;

    for (let i = 0; i <= 5; i++) {
      const yLine = y + padding.top + chartHeight * (i / 5);
      doc.moveTo(x + padding.left, yLine)
        .lineTo(x + width - padding.right, yLine)
        .strokeColor('#eee').lineWidth(0.5).stroke();

      const labelValue = Math.round(maxValue * (1 - i / 5));
      doc.fontSize(8).fillColor('#999').text(String(labelValue), x + 5, yLine - 5, { width: 40, align: 'right' });
    }

    const labelCount = data.labels.length;
    for (let i = 0; i < labelCount; i++) {
      const xPos = x + padding.left + (chartWidth / (labelCount - 1 || 1)) * i;
      doc.fontSize(7).fillColor('#999').text(data.labels[i].slice(5), xPos - 20, y + height - padding.bottom + 10, { width: 40, align: 'center' });
    }

    data.datasets.forEach((dataset, dsIndex) => {
      if (dataset.data.length === 0) return;

      doc.moveTo(
        x + padding.left,
        y + padding.top + chartHeight * (1 - dataset.data[0] / maxValue)
      );

      for (let i = 1; i < dataset.data.length; i++) {
        const xPos = x + padding.left + (chartWidth / (dataset.data.length - 1 || 1)) * i;
        const yPos = y + padding.top + chartHeight * (1 - dataset.data[i] / maxValue);
        doc.lineTo(xPos, yPos);
      }

      doc.strokeColor(colors[dsIndex % colors.length]).lineWidth(2).stroke();
    });

    const legendY = y + 5;
    data.datasets.forEach((dataset, dsIndex) => {
      const legendX = x + padding.left + dsIndex * 120;
      doc.fillColor(colors[dsIndex % colors.length]).rect(legendX, legendY, 12, 12).fill();
      doc.fontSize(10).fillColor('#333').text(dataset.label, legendX + 18, legendY);
    });

    doc.restore();
  },

  exportWeeklyReportPDF: async (restaurantId) => {
    const restaurant = Restaurant.findById(restaurantId);
    if (!restaurant) return { success: false, error: '餐厅不存在' };

    const weeklyData = reportService.getWeeklyReport(restaurantId);
    const radarData = reportService.getRadarChartData(restaurantId);
    const lineData = reportService.getLineChartData(restaurantId);

    const reportsDir = path.join(__dirname, '../../reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }

    const filename = `weekly_report_${restaurantId}_${Date.now()}.pdf`;
    const filepath = path.join(reportsDir, filename);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const stream = fs.createWriteStream(filepath);
    doc.pipe(stream);

    doc.fontSize(24).text('周度经营报告', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(14).text(`餐厅: ${restaurant.name}`, { align: 'center' });
    doc.text(`菜系: ${restaurant.cuisine_type} | 等级: Lv.${restaurant.level}`, { align: 'center' });
    doc.moveDown(1);

    doc.fontSize(16).text('周度汇总', { underline: true });
    doc.moveDown(0.5);
    doc.fontSize(12);
    doc.text(`总收入: ¥${weeklyData.summary.total_revenue.toFixed(2)}`);
    doc.text(`总成本: ¥${weeklyData.summary.total_cost.toFixed(2)}`);
    doc.text(`净利润: ¥${weeklyData.summary.net_profit.toFixed(2)}`);
    doc.text(`总顾客数: ${weeklyData.summary.total_customers}`);
    doc.text(`平均满意度: ${weeklyData.summary.avg_satisfaction.toFixed(2)} / 5.0`);
    doc.moveDown(1);

    doc.fontSize(16).text('能力雷达图', { underline: true });
    doc.moveDown(0.3);
    if (radarData) {
      reportService.drawRadarInPDF(doc, 70, doc.y, 400, 400, radarData);
    }
    doc.moveDown(1);

    doc.addPage();
    doc.fontSize(16).text('收入与满意度趋势', { underline: true });
    doc.moveDown(0.3);
    if (lineData) {
      reportService.drawLineChartInPDF(doc, 50, doc.y, 500, 280, lineData);
    }
    doc.y += 300;
    doc.moveDown(1);

    doc.fontSize(16).text('热门菜品', { underline: true });
    doc.moveDown(0.5);
    const popularDishes = weeklyData.reports.flatMap(r => r.popular_dishes_json || []);
    const dishMap = new Map();
    for (const d of popularDishes) {
      if (!dishMap.has(d.dish_id)) {
        dishMap.set(d.dish_id, { name: d.name, sales: 0, revenue: 0 });
      }
      const existing = dishMap.get(d.dish_id);
      existing.sales += d.sales_count || 0;
      existing.revenue += d.revenue || 0;
    }
    const topDishes = Array.from(dishMap.values()).sort((a, b) => b.sales - a.sales).slice(0, 5);
    for (let i = 0; i < topDishes.length; i++) {
      const d = topDishes[i];
      doc.fontSize(12).text(`${i + 1}. ${d.name} - 销量: ${d.sales}, 收入: ¥${d.revenue.toFixed(2)}`);
    }
    doc.moveDown(1);

    doc.fontSize(10).text('报告生成时间: ' + new Date().toLocaleString('zh-CN'), { align: 'right' });

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        resolve({ success: true, filepath, filename });
      });
      stream.on('error', (err) => {
        reject({ success: false, error: err.message });
      });
    });
  },

  getReportStats: (restaurantId) => {
    const restaurant = Restaurant.findById(restaurantId);
    if (!restaurant) return null;

    const weekly = reportService.getWeeklyReport(restaurantId);
    const dishes = Dish.findByRestaurantId(restaurantId);
    const inventory = Inventory.findByRestaurantId(restaurantId);

    return {
      restaurant: {
        name: restaurant.name,
        level: restaurant.level,
        cuisine_type: restaurant.cuisine_type,
        decor_style: restaurant.decor_style,
        avg_rating: restaurant.avg_rating,
        total_profit: restaurant.total_profit
      },
      weekly_summary: weekly.summary,
      total_dishes: dishes.length,
      total_inventory_items: inventory.length,
      inventory_value: Inventory.getTotalValue(restaurantId)
    };
  }
};

module.exports = reportService;
