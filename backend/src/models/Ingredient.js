const database = require('../config/database');

const getDb = () => database.db;

const Ingredient = {
  create: (name, category, rarity, basePrice, freshnessDays, seasonAffect = 1.0) => {
    const db = getDb();
    const result = db.prepare('INSERT INTO ingredients (name, category, rarity, base_price, current_price, freshness_days, season_affect) VALUES (?, ?, ?, ?, ?, ?, ?)').run(name, category, rarity, basePrice, basePrice, freshnessDays, seasonAffect);
    return Ingredient.findById(result.lastInsertRowid);
  },

  findById: (id) => {
    const db = getDb();
    return db.prepare('SELECT * FROM ingredients WHERE id = ?').get(id);
  },

  findByName: (name) => {
    const db = getDb();
    return db.prepare('SELECT * FROM ingredients WHERE name = ?').get(name);
  },

  findAll: () => {
    const db = getDb();
    return db.prepare('SELECT * FROM ingredients ORDER BY category, name').all();
  },

  findByCategory: (category) => {
    const db = getDb();
    return db.prepare('SELECT * FROM ingredients WHERE category = ? ORDER BY name').all(category);
  },

  updatePrice: (id, newPrice) => {
    const db = getDb();
    db.prepare('UPDATE ingredients SET current_price = ? WHERE id = ?').run(newPrice, id);
    return Ingredient.findById(id);
  },

  update: (id, data) => {
    const db = getDb();
    const fields = [];
    const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.category !== undefined) { fields.push('category = ?'); values.push(data.category); }
    if (data.rarity !== undefined) { fields.push('rarity = ?'); values.push(data.rarity); }
    if (data.base_price !== undefined) { fields.push('base_price = ?'); values.push(data.base_price); }
    if (data.current_price !== undefined) { fields.push('current_price = ?'); values.push(data.current_price); }
    if (data.freshness_days !== undefined) { fields.push('freshness_days = ?'); values.push(data.freshness_days); }
    if (data.season_affect !== undefined) { fields.push('season_affect = ?'); values.push(data.season_affect); }
    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE ingredients SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
    return Ingredient.findById(id);
  }
};

module.exports = Ingredient;
