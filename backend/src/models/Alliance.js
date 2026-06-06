const database = require('../config/database');

const getDb = () => database.db;

const Alliance = {
  create: (name, founderId) => {
    const db = getDb();
    const result = db.prepare('INSERT INTO alliances (name, founder_id, members_json) VALUES (?, ?, ?)').run(name, founderId, JSON.stringify([founderId]));
    return Alliance.findById(result.lastInsertRowid);
  },

  findById: (id) => {
    const db = getDb();
    const alliance = db.prepare('SELECT * FROM alliances WHERE id = ?').get(id);
    if (alliance) {
      alliance.members_json = JSON.parse(alliance.members_json);
      const founder = db.prepare('SELECT id, username FROM players WHERE id = ?').get(alliance.founder_id);
      alliance.founder = founder;
    }
    return alliance;
  },

  findByName: (name) => {
    const db = getDb();
    const alliance = db.prepare('SELECT * FROM alliances WHERE name = ?').get(name);
    if (alliance) {
      alliance.members_json = JSON.parse(alliance.members_json);
    }
    return alliance;
  },

  findAll: () => {
    const db = getDb();
    const alliances = db.prepare('SELECT * FROM alliances ORDER BY created_at DESC').all();
    return alliances.map(alliance => ({
      ...alliance,
      members_json: JSON.parse(alliance.members_json)
    }));
  },

  addMember: (allianceId, playerId) => {
    const db = getDb();
    const alliance = Alliance.findById(allianceId);
    if (!alliance) return null;
    if (!alliance.members_json.includes(playerId)) {
      alliance.members_json.push(playerId);
      db.prepare('UPDATE alliances SET members_json = ? WHERE id = ?').run(JSON.stringify(alliance.members_json), allianceId);
    }
    return Alliance.findById(allianceId);
  },

  removeMember: (allianceId, playerId) => {
    const db = getDb();
    const alliance = Alliance.findById(allianceId);
    if (!alliance) return null;
    if (playerId === alliance.founder_id) return null;
    alliance.members_json = alliance.members_json.filter(id => id !== playerId);
    db.prepare('UPDATE alliances SET members_json = ? WHERE id = ?').run(JSON.stringify(alliance.members_json), allianceId);
    return Alliance.findById(allianceId);
  },

  findByPlayerId: (playerId) => {
    const db = getDb();
    const alliances = db.prepare('SELECT * FROM alliances').all();
    return alliances
      .map(a => ({ ...a, members_json: JSON.parse(a.members_json) }))
      .filter(a => a.members_json.includes(playerId));
  },

  delete: (id) => {
    const db = getDb();
    const result = db.prepare('DELETE FROM alliances WHERE id = ?').run(id);
    return result.changes > 0;
  }
};

module.exports = Alliance;
