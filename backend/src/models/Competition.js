const database = require('../config/database');

const getDb = () => database.db;

const Competition = {
  create: (date) => {
    const db = getDb();
    const result = db.prepare('INSERT INTO competitions (date) VALUES (?)').run(date);
    return Competition.findById(result.lastInsertRowid);
  },

  findById: (id) => {
    const db = getDb();
    const comp = db.prepare('SELECT * FROM competitions WHERE id = ?').get(id);
    if (comp) {
      comp.participants_json = JSON.parse(comp.participants_json);
      comp.results_json = JSON.parse(comp.results_json);
    }
    return comp;
  },

  findByStatus: (status) => {
    const db = getDb();
    const comps = db.prepare('SELECT * FROM competitions WHERE status = ? ORDER BY date DESC').all(status);
    return comps.map(comp => ({
      ...comp,
      participants_json: JSON.parse(comp.participants_json),
      results_json: JSON.parse(comp.results_json)
    }));
  },

  findAll: () => {
    const db = getDb();
    const comps = db.prepare('SELECT * FROM competitions ORDER BY date DESC').all();
    return comps.map(comp => ({
      ...comp,
      participants_json: JSON.parse(comp.participants_json),
      results_json: JSON.parse(comp.results_json)
    }));
  },

  update: (id, data) => {
    const db = getDb();
    const fields = [];
    const values = [];
    if (data.date !== undefined) { fields.push('date = ?'); values.push(data.date); }
    if (data.status !== undefined) { fields.push('status = ?'); values.push(data.status); }
    if (data.participants_json !== undefined) { fields.push('participants_json = ?'); values.push(JSON.stringify(data.participants_json)); }
    if (data.results_json !== undefined) { fields.push('results_json = ?'); values.push(JSON.stringify(data.results_json)); }
    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE competitions SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
    return Competition.findById(id);
  },

  addParticipant: (competitionId, restaurantId) => {
    const comp = Competition.findById(competitionId);
    if (!comp) return null;
    if (!comp.participants_json.includes(restaurantId)) {
      comp.participants_json.push(restaurantId);
      return Competition.update(competitionId, { participants_json: comp.participants_json });
    }
    return comp;
  },

  removeParticipant: (competitionId, restaurantId) => {
    const comp = Competition.findById(competitionId);
    if (!comp) return null;
    comp.participants_json = comp.participants_json.filter(id => id !== restaurantId);
    return Competition.update(competitionId, { participants_json: comp.participants_json });
  },

  setResults: (competitionId, results) => {
    return Competition.update(competitionId, { results_json: results, status: 'completed' });
  },

  getActive: () => {
    const db = getDb();
    return db.prepare('SELECT * FROM competitions WHERE status = ? ORDER BY date DESC LIMIT 1').get('active');
  },

  getUpcoming: () => {
    const db = getDb();
    return db.prepare('SELECT * FROM competitions WHERE status = ? ORDER BY date ASC LIMIT 1').get('upcoming');
  }
};

module.exports = Competition;
