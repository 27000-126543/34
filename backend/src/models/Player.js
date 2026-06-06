const bcrypt = require('bcryptjs');
const database = require('../config/database');

const getDb = () => database.db;

const Player = {
  create: (username, email, password) => {
    const db = getDb();
    const hashedPassword = bcrypt.hashSync(password, 10);
    const result = db.prepare('INSERT INTO players (username, email, password) VALUES (?, ?, ?)').run(username, email, hashedPassword);
    return Player.findById(result.lastInsertRowid);
  },

  findById: (id) => {
    const db = getDb();
    return db.prepare('SELECT id, username, email, coins, reputation, research_points, created_at FROM players WHERE id = ?').get(id);
  },

  findByUsername: (username) => {
    const db = getDb();
    return db.prepare('SELECT * FROM players WHERE username = ?').get(username);
  },

  findByEmail: (email) => {
    const db = getDb();
    return db.prepare('SELECT * FROM players WHERE email = ?').get(email);
  },

  verifyPassword: (player, password) => {
    return bcrypt.compareSync(password, player.password);
  },

  updateCoins: (id, amount) => {
    const db = getDb();
    db.prepare('UPDATE players SET coins = coins + ? WHERE id = ?').run(amount, id);
    return Player.findById(id);
  },

  updateReputation: (id, amount) => {
    const db = getDb();
    db.prepare('UPDATE players SET reputation = reputation + ? WHERE id = ?').run(amount, id);
    return Player.findById(id);
  },

  updateResearchPoints: (id, amount) => {
    const db = getDb();
    db.prepare('UPDATE players SET research_points = research_points + ? WHERE id = ?').run(amount, id);
    return Player.findById(id);
  },

  findAll: () => {
    const db = getDb();
    return db.prepare('SELECT id, username, email, coins, reputation, research_points, created_at FROM players ORDER BY reputation DESC').all();
  }
};

module.exports = Player;
