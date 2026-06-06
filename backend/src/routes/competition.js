const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Restaurant = require('../models/Restaurant');
const competitionService = require('../services/competitionService');

let io;

const setIo = (socketIo) => {
  io = socketIo;
};

router.get('/', auth, (req, res) => {
  try {
    const competitions = competitionService.getActiveCompetitions();
    res.json({ competitions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/upcoming', auth, (req, res) => {
  try {
    const competitions = competitionService.getUpcomingCompetitions();
    res.json({ competitions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/completed', auth, (req, res) => {
  try {
    const competitions = competitionService.getCompletedCompetitions();
    res.json({ competitions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, (req, res) => {
  try {
    const competition = competitionService.getCompetitionDetails(req.params.id);
    if (!competition) {
      return res.status(404).json({ error: '比赛不存在' });
    }
    res.json({ competition });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { date } = req.body;
    if (!date) {
      return res.status(400).json({ error: '请提供比赛日期' });
    }
    const competition = competitionService.createCompetition(date);
    res.json({ competition });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/register', auth, (req, res) => {
  try {
    const { restaurant_id } = req.body;
    if (!restaurant_id) {
      return res.status(400).json({ error: '请提供餐厅ID' });
    }
    const restaurant = Restaurant.findById(restaurant_id);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限操作' });
    }
    const result = competitionService.registerForCompetition(req.params.id, restaurant_id);
    if (result.success && io) {
      io.emit('competition:update', { type: 'register', data: result });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/unregister', auth, (req, res) => {
  try {
    const { restaurant_id } = req.body;
    if (!restaurant_id) {
      return res.status(400).json({ error: '请提供餐厅ID' });
    }
    const restaurant = Restaurant.findById(restaurant_id);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限操作' });
    }
    const result = competitionService.unregisterFromCompetition(req.params.id, restaurant_id);
    if (result.success && io) {
      io.emit('competition:update', { type: 'unregister', data: result });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/start', auth, (req, res) => {
  try {
    const result = competitionService.startCompetition(req.params.id);
    if (result && !result.error && io) {
      io.emit('competition:update', { type: 'start', data: result });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/execute', auth, (req, res) => {
  try {
    const results = competitionService.executeCompetitionRound(req.params.id);
    if (results && io) {
      io.emit('competition:update', { type: 'round_result', data: results });
    }
    res.json({ results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/complete', auth, (req, res) => {
  try {
    const result = competitionService.completeCompetition(req.params.id);
    if (result.success && io) {
      io.emit('competition:update', { type: 'complete', data: result });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/match', auth, (req, res) => {
  try {
    const matches = competitionService.matchParticipants(req.params.id);
    res.json({ matches });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, setIo };
