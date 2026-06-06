const database = require('../config/database');

const getDb = () => database.db;

const MarketTransaction = {
  create: (buyerId, sellerId, ingredientId, quantity, price) => {
    const db = getDb();
    const result = db.prepare('INSERT INTO market_transactions (buyer_id, seller_id, ingredient_id, quantity, price) VALUES (?, ?, ?, ?, ?)').run(buyerId, sellerId, ingredientId, quantity, price);
    return MarketTransaction.findById(result.lastInsertRowid);
  },

  findById: (id) => {
    const db = getDb();
    const tx = db.prepare('SELECT * FROM market_transactions WHERE id = ?').get(id);
    return tx;
  },

  findByBuyerId: (buyerId) => {
    const db = getDb();
    return db.prepare(`
      SELECT mt.*, ing.name as ingredient_name, r.name as seller_name
      FROM market_transactions mt
      JOIN ingredients ing ON mt.ingredient_id = ing.id
      JOIN restaurants r ON mt.seller_id = r.id
      WHERE mt.buyer_id = ?
      ORDER BY mt.timestamp DESC
    `).all(buyerId);
  },

  findBySellerId: (sellerId) => {
    const db = getDb();
    return db.prepare(`
      SELECT mt.*, ing.name as ingredient_name, r.name as buyer_name
      FROM market_transactions mt
      JOIN ingredients ing ON mt.ingredient_id = ing.id
      JOIN restaurants r ON mt.buyer_id = r.id
      WHERE mt.seller_id = ?
      ORDER BY mt.timestamp DESC
    `).all(sellerId);
  },

  findAll: (limit = 50) => {
    const db = getDb();
    return db.prepare(`
      SELECT mt.*, ing.name as ingredient_name, br.name as buyer_name, sr.name as seller_name
      FROM market_transactions mt
      JOIN ingredients ing ON mt.ingredient_id = ing.id
      JOIN restaurants br ON mt.buyer_id = br.id
      JOIN restaurants sr ON mt.seller_id = sr.id
      ORDER BY mt.timestamp DESC
      LIMIT ?
    `).all(limit);
  },

  findByIngredientId: (ingredientId, limit = 20) => {
    const db = getDb();
    return db.prepare(`
      SELECT mt.*, br.name as buyer_name, sr.name as seller_name
      FROM market_transactions mt
      JOIN restaurants br ON mt.buyer_id = br.id
      JOIN restaurants sr ON mt.seller_id = sr.id
      WHERE mt.ingredient_id = ?
      ORDER BY mt.timestamp DESC
      LIMIT ?
    `).all(ingredientId, limit);
  },

  getTransactionVolume: (ingredientId, hours = 24) => {
    const db = getDb();
    const result = db.prepare(`
      SELECT SUM(quantity) as total_quantity, AVG(price) as avg_price
      FROM market_transactions
      WHERE ingredient_id = ? AND timestamp >= datetime('now', '-' || ? || ' hours')
    `).get(ingredientId, hours);
    return {
      total_quantity: result.total_quantity || 0,
      avg_price: result.avg_price || 0
    };
  }
};

module.exports = MarketTransaction;
