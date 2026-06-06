const database = require('../config/database');

const getDb = () => database.db;

const Chef = {
  create: (restaurantId, name) => {
    const db = getDb();
    const result = db.prepare('INSERT INTO chefs (restaurant_id, name) VALUES (?, ?)').run(restaurantId, name);
    return Chef.findById(result.lastInsertRowid);
  },

  findById: (id) => {
    const db = getDb();
    return db.prepare('SELECT * FROM chefs WHERE id = ?').get(id);
  },

  findByRestaurantId: (restaurantId) => {
    const db = getDb();
    return db.prepare('SELECT * FROM chefs WHERE restaurant_id = ?').all(restaurantId);
  },

  update: (id, data) => {
    const db = getDb();
    const fields = [];
    const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.level !== undefined) { fields.push('level = ?'); values.push(data.level); }
    if (data.skill !== undefined) { fields.push('skill = ?'); values.push(data.skill); }
    if (data.exp !== undefined) { fields.push('exp = ?'); values.push(data.exp); }
    if (data.pending_promotion !== undefined) { fields.push('pending_promotion = ?'); values.push(data.pending_promotion); }
    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE chefs SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
    return Chef.findById(id);
  },

  addExp: (id, amount) => {
    const chef = Chef.findById(id);
    if (!chef) return null;
    const newExp = chef.exp + amount;
    return Chef.update(id, { exp: newExp });
  },

  delete: (id) => {
    const db = getDb();
    const result = db.prepare('DELETE FROM chefs WHERE id = ?').run(id);
    return result.changes > 0;
  },

  findAllPendingPromotion: (restaurantId) => {
    const db = getDb();
    return db.prepare('SELECT * FROM chefs WHERE restaurant_id = ? AND pending_promotion = 1').all(restaurantId);
  },

  getTotalSkillByRestaurant: (restaurantId) => {
    const db = getDb();
    const result = db.prepare('SELECT SUM(skill) as total_skill FROM chefs WHERE restaurant_id = ?').get(restaurantId);
    return result.total_skill || 0;
  }
};

module.exports = Chef;
