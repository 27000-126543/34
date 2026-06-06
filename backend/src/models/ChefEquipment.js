const database = require('../config/database');

const getDb = () => database.db;

const ChefEquipment = {
  create: (name, type, bonusSkill, rarity, costPoints) => {
    const db = getDb();
    const result = db.prepare('INSERT INTO chef_equipment (name, type, bonus_skill, rarity, cost_points) VALUES (?, ?, ?, ?, ?)').run(name, type, bonusSkill, rarity, costPoints);
    return ChefEquipment.findById(result.lastInsertRowid);
  },

  findById: (id) => {
    const db = getDb();
    return db.prepare('SELECT * FROM chef_equipment WHERE id = ?').get(id);
  },

  findAll: () => {
    const db = getDb();
    return db.prepare('SELECT * FROM chef_equipment ORDER BY type, rarity').all();
  },

  findByType: (type) => {
    const db = getDb();
    return db.prepare('SELECT * FROM chef_equipment WHERE type = ? ORDER BY rarity').all(type);
  },

  findByRarity: (rarity) => {
    const db = getDb();
    return db.prepare('SELECT * FROM chef_equipment WHERE rarity = ? ORDER BY type').all(rarity);
  },

  update: (id, data) => {
    const db = getDb();
    const fields = [];
    const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.type !== undefined) { fields.push('type = ?'); values.push(data.type); }
    if (data.bonus_skill !== undefined) { fields.push('bonus_skill = ?'); values.push(data.bonus_skill); }
    if (data.rarity !== undefined) { fields.push('rarity = ?'); values.push(data.rarity); }
    if (data.cost_points !== undefined) { fields.push('cost_points = ?'); values.push(data.cost_points); }
    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE chef_equipment SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
    return ChefEquipment.findById(id);
  }
};

module.exports = ChefEquipment;
