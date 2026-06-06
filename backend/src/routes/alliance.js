const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Restaurant = require('../models/Restaurant');
const Alliance = require('../models/Alliance');
const allianceService = require('../services/allianceService');

let io;

const setIo = (socketIo) => {
  io = socketIo;
};

router.get('/', auth, (req, res) => {
  try {
    const allAlliances = Alliance.findAll();
    res.json({ alliances: allAlliances });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/player', auth, (req, res) => {
  try {
    const alliances = Alliance.findByPlayerId(req.player.id);
    res.json({ alliances });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, (req, res) => {
  try {
    const data = allianceService.getAllianceMembers(req.params.id);
    if (!data) {
      return res.status(404).json({ error: '联盟不存在' });
    }
    const stats = allianceService.getAllianceStats(req.params.id);
    res.json({ ...data, stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { name } = req.body;
    if (!name) {
      return res.status(400).json({ error: '请提供联盟名称' });
    }
    const result = allianceService.createAlliance(name, req.player.id);
    if (result.success && io) {
      io.emit('alliance:update', { type: 'create', data: result });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/join', auth, (req, res) => {
  try {
    const result = allianceService.joinAlliance(req.params.id, req.player.id);
    if (result.success && io) {
      io.emit('restaurant:update', { type: 'alliance_join', data: result });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/leave', auth, (req, res) => {
  try {
    const result = allianceService.leaveAlliance(req.params.id, req.player.id);
    if (result.success && io) {
      io.emit('restaurant:update', { type: 'alliance_leave', player_id: req.player.id });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    const result = allianceService.disbandAlliance(req.params.id, req.player.id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/inventory', auth, (req, res) => {
  try {
    const inventory = allianceService.getAllianceInventory(req.params.id);
    res.json({ inventory });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/share', auth, (req, res) => {
  try {
    const { from_restaurant_id, to_restaurant_id, ingredient_id, quantity } = req.body;
    if (!from_restaurant_id || !to_restaurant_id || !ingredient_id || !quantity) {
      return res.status(400).json({ error: '请提供所有必填参数' });
    }
    const fromRestaurant = Restaurant.findById(from_restaurant_id);
    if (!fromRestaurant || fromRestaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限操作' });
    }
    const result = allianceService.shareInventory(
      from_restaurant_id,
      to_restaurant_id,
      ingredient_id,
      quantity,
      req.params.id
    );
    if (result.success && io) {
      io.emit('restaurant:update', { type: 'inventory_share', data: result });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/duels', auth, (req, res) => {
  try {
    const duels = allianceService.getAllianceDuels(req.params.id);
    res.json({ duels });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/duels', auth, (req, res) => {
  try {
    const { challenger_restaurant_id, defender_restaurant_id } = req.body;
    if (!challenger_restaurant_id || !defender_restaurant_id) {
      return res.status(400).json({ error: '请提供所有必填参数' });
    }
    const challenger = Restaurant.findById(challenger_restaurant_id);
    if (!challenger || challenger.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限操作' });
    }
    const result = allianceService.initiateDuel(challenger_restaurant_id, defender_restaurant_id);
    if (result.success && io) {
      io.emit('duel:update', { type: 'start', data: result });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/duels/:duelId/execute', auth, (req, res) => {
  try {
    const result = allianceService.executeDuel(req.params.duelId);
    if (result.success && io) {
      io.emit('duel:update', { type: 'complete', data: result });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, setIo };
