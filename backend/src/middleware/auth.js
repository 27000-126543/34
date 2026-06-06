const jwt = require('jsonwebtoken');
const database = require('../config/database');

const JWT_SECRET = 'global_cuisine_tycoon_secret_key_2024';
const getDb = () => database.db;

const auth = (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }
    const decoded = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    const player = db.prepare('SELECT id, username, email, coins, reputation, research_points, created_at FROM players WHERE id = ?').get(decoded.playerId);
    if (!player) {
      return res.status(401).json({ error: '认证失败，用户不存在' });
    }
    req.player = player;
    next();
  } catch (error) {
    res.status(401).json({ error: '认证令牌无效或已过期' });
  }
};

const generateToken = (playerId) => {
  return jwt.sign({ playerId }, JWT_SECRET, { expiresIn: '7d' });
};

module.exports = {
  auth,
  generateToken,
  JWT_SECRET
};
