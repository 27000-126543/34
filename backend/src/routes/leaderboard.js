const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const leaderboardService = require('../services/leaderboardService');

router.get('/', auth, (req, res) => {
  try {
    const leaderboards = leaderboardService.getAllLeaderboards();
    res.json(leaderboards);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profit', auth, (req, res) => {
  try {
    const { limit } = req.query;
    const leaderboard = leaderboardService.getProfitLeaderboard(parseInt(limit) || 20);
    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/rating', auth, (req, res) => {
  try {
    const { limit } = req.query;
    const leaderboard = leaderboardService.getRatingLeaderboard(parseInt(limit) || 20);
    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/chef-level', auth, (req, res) => {
  try {
    const { limit } = req.query;
    const leaderboard = leaderboardService.getChefLevelLeaderboard(parseInt(limit) || 20);
    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/reputation', auth, (req, res) => {
  try {
    const { limit } = req.query;
    const leaderboard = leaderboardService.getPlayerReputationLeaderboard(parseInt(limit) || 20);
    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/dish-popularity', auth, (req, res) => {
  try {
    const { limit } = req.query;
    const leaderboard = leaderboardService.getDishPopularityLeaderboard(parseInt(limit) || 20);
    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/alliance', auth, (req, res) => {
  try {
    const { limit } = req.query;
    const leaderboard = leaderboardService.getAllianceLeaderboard(parseInt(limit) || 10);
    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/cuisine-stats', auth, (req, res) => {
  try {
    const stats = leaderboardService.getCuisineTypeLeaderboard();
    res.json({ cuisine_stats: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/my-rank', auth, (req, res) => {
  try {
    const rank = leaderboardService.getPlayerRank(req.player.id);
    res.json({ rank });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
