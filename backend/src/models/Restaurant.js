const database = require('../config/database');

const getDb = () => database.db;

const Restaurant = {
  create: (ownerId, name, cuisineType, decorStyle) => {
    const db = getDb();
    const result = db.prepare('INSERT INTO restaurants (owner_id, name, cuisine_type, decor_style) VALUES (?, ?, ?, ?)').run(ownerId, name, cuisineType, decorStyle);
    return Restaurant.findById(result.lastInsertRowid);
  },

  findById: (id) => {
    const db = getDb();
    const restaurant = db.prepare('SELECT * FROM restaurants WHERE id = ?').get(id);
    if (restaurant) {
      restaurant.chefs = db.prepare('SELECT * FROM chefs WHERE restaurant_id = ?').all(id);
      restaurant.dishes = db.prepare('SELECT * FROM dishes WHERE restaurant_id = ?').all(id);
    }
    return restaurant;
  },

  findByOwnerId: (ownerId) => {
    const db = getDb();
    return db.prepare('SELECT * FROM restaurants WHERE owner_id = ?').all(ownerId);
  },

  update: (id, data) => {
    const db = getDb();
    const fields = [];
    const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.cuisine_type !== undefined) { fields.push('cuisine_type = ?'); values.push(data.cuisine_type); }
    if (data.decor_style !== undefined) { fields.push('decor_style = ?'); values.push(data.decor_style); }
    if (data.level !== undefined) { fields.push('level = ?'); values.push(data.level); }
    if (data.total_profit !== undefined) { fields.push('total_profit = ?'); values.push(data.total_profit); }
    if (data.avg_rating !== undefined) { fields.push('avg_rating = ?'); values.push(data.avg_rating); }
    if (data.alliance_id !== undefined) { fields.push('alliance_id = ?'); values.push(data.alliance_id); }
    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE restaurants SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
    return Restaurant.findById(id);
  },

  addProfit: (id, amount) => {
    const db = getDb();
    db.prepare('UPDATE restaurants SET total_profit = total_profit + ? WHERE id = ?').run(amount, id);
    return Restaurant.findById(id);
  },

  updateRating: (id, rating) => {
    const db = getDb();
    db.prepare('UPDATE restaurants SET avg_rating = ? WHERE id = ?').run(rating, id);
    return Restaurant.findById(id);
  },

  findAll: () => {
    const db = getDb();
    return db.prepare('SELECT * FROM restaurants ORDER BY total_profit DESC').all();
  },

  findByAllianceId: (allianceId) => {
    const db = getDb();
    return db.prepare('SELECT * FROM restaurants WHERE alliance_id = ?').all(allianceId);
  }
};

module.exports = Restaurant;
