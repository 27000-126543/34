const database = require('../config/database');

const getDb = () => database.db;

const Duel = {
  create: (challengerId, defenderId) => {
    const db = getDb();
    const result = db.prepare('INSERT INTO duels (challenger_id, defender_id) VALUES (?, ?)').run(challengerId, defenderId);
    return Duel.findById(result.lastInsertRowid);
  },

  findById: (id) => {
    const db = getDb();
    const duel = db.prepare('SELECT * FROM duels WHERE id = ?').get(id);
    if (duel) {
      duel.dish_results_json = JSON.parse(duel.dish_results_json);
    }
    return duel;
  },

  findByRestaurantId: (restaurantId) => {
    const db = getDb();
    const duels = db.prepare('SELECT * FROM duels WHERE challenger_id = ? OR defender_id = ? ORDER BY start_time DESC').all(restaurantId, restaurantId);
    return duels.map(duel => ({
      ...duel,
      dish_results_json: JSON.parse(duel.dish_results_json)
    }));
  },

  findActiveByRestaurantId: (restaurantId) => {
    const db = getDb();
    const duels = db.prepare("SELECT * FROM duels WHERE (challenger_id = ? OR defender_id = ?) AND status = 'active' ORDER BY start_time DESC").all(restaurantId, restaurantId);
    return duels.map(duel => ({
      ...duel,
      dish_results_json: JSON.parse(duel.dish_results_json)
    }));
  },

  findAll: () => {
    const db = getDb();
    const duels = db.prepare('SELECT * FROM duels ORDER BY start_time DESC').all();
    return duels.map(duel => ({
      ...duel,
      dish_results_json: JSON.parse(duel.dish_results_json)
    }));
  },

  update: (id, data) => {
    const db = getDb();
    const fields = [];
    const values = [];
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (data.dish_results_json !== undefined) { fields.push('dish_results_json = ?'); values.push(JSON.stringify(data.dish_results_json)); }
    if (data.winner_id !== undefined) { fields.push('winner_id = ?'); values.push(data.winner_id); }
    if (data.end_time !== undefined) { fields.push('end_time = ?'); values.push(data.end_time); }
    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE duels SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
    return Duel.findById(id);
  },

  complete: (id, winnerId, dishResults) => {
    return Duel.update(id, {
      status: 'completed',
      winner_id: winnerId,
      dish_results_json: dishResults,
      end_time: new Date().toISOString()
    });
  },

  addDishResult: (duelId, dishResult) => {
    const duel = Duel.findById(duelId);
    if (!duel) return null;
    duel.dish_results_json.push(dishResult);
    return Duel.update(duelId, { dish_results_json: duel.dish_results_json });
  }
};

module.exports = Duel;
