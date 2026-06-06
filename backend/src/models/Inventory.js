const database = require('../config/database');

const getDb = () => database.db;

const Inventory = {
  create: (restaurantId, ingredientId, quantity, freshness = 100) => {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM inventory WHERE restaurant_id = ? AND ingredient_id = ?').get(restaurantId, ingredientId);
    if (existing) {
      return Inventory.updateQuantity(existing.id, quantity);
    }
    const result = db.prepare('INSERT INTO inventory (restaurant_id, ingredient_id, quantity, freshness) VALUES (?, ?, ?, ?)').run(restaurantId, ingredientId, quantity, freshness);
    return Inventory.findById(result.lastInsertRowid);
  },

  findById: (id) => {
    const db = getDb();
    return db.prepare('SELECT * FROM inventory WHERE id = ?').get(id);
  },

  findByRestaurantId: (restaurantId) => {
    const db = getDb();
    return db.prepare(`
      SELECT i.*, ing.name as ingredient_name, ing.category, ing.current_price, ing.base_price
      FROM inventory i
      JOIN ingredients ing ON i.ingredient_id = ing.id
      WHERE i.restaurant_id = ?
      ORDER BY ing.category, ing.name
    `).all(restaurantId);
  },

  findByRestaurantAndIngredient: (restaurantId, ingredientId) => {
    const db = getDb();
    return db.prepare('SELECT * FROM inventory WHERE restaurant_id = ? AND ingredient_id = ?').get(restaurantId, ingredientId);
  },

  updateQuantity: (id, delta) => {
    const db = getDb();
    const item = Inventory.findById(id);
    if (!item) return null;
    const newQuantity = Math.max(0, item.quantity + delta);
    db.prepare('UPDATE inventory SET quantity = ? WHERE id = ?').run(newQuantity, id);
    if (newQuantity === 0) {
      db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
      return null;
    }
    return Inventory.findById(id);
  },

  updateFreshness: (id, freshness) => {
    const db = getDb();
    db.prepare('UPDATE inventory SET freshness = ? WHERE id = ?').run(freshness, id);
    return Inventory.findById(id);
  },

  updateAllFreshness: (restaurantId) => {
    const db = getDb();
    db.prepare('UPDATE inventory SET freshness = GREATEST(0, freshness - 5) WHERE restaurant_id = ?').run(restaurantId);
    db.prepare('DELETE FROM inventory WHERE freshness <= 0').run();
  },

  delete: (id) => {
    const db = getDb();
    const result = db.prepare('DELETE FROM inventory WHERE id = ?').run(id);
    return result.changes > 0;
  },

  getTotalValue: (restaurantId) => {
    const db = getDb();
    const result = db.prepare(`
      SELECT SUM(i.quantity * ing.current_price) as total_value
      FROM inventory i
      JOIN ingredients ing ON i.ingredient_id = ing.id
      WHERE i.restaurant_id = ?
    `).get(restaurantId);
    return result.total_value || 0;
  }
};

module.exports = Inventory;
