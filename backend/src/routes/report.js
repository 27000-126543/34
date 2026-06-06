const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Restaurant = require('../models/Restaurant');
const reportService = require('../services/reportService');
const path = require('path');
const fs = require('fs');

router.get('/stats/:restaurantId', auth, (req, res) => {
  try {
    const restaurant = Restaurant.findById(req.params.restaurantId);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限查看' });
    }
    const stats = reportService.getReportStats(req.params.restaurantId);
    res.json({ stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/daily/:restaurantId', auth, (req, res) => {
  try {
    const { date } = req.query;
    const restaurant = Restaurant.findById(req.params.restaurantId);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限查看' });
    }
    const report = reportService.generateDailyReport(req.params.restaurantId, date);
    res.json({ report });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/weekly/:restaurantId', auth, (req, res) => {
  try {
    const { end_date } = req.query;
    const restaurant = Restaurant.findById(req.params.restaurantId);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限查看' });
    }
    const weekly = reportService.getWeeklyReport(req.params.restaurantId, end_date);
    res.json({ weekly });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/range/:restaurantId', auth, (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    if (!start_date || !end_date) {
      return res.status(400).json({ error: '请提供开始和结束日期' });
    }
    const restaurant = Restaurant.findById(req.params.restaurantId);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限查看' });
    }
    const reports = reportService.getReportsByDateRange(req.params.restaurantId, start_date, end_date);
    res.json({ reports });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/chart/radar/:restaurantId', auth, (req, res) => {
  try {
    const restaurant = Restaurant.findById(req.params.restaurantId);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限查看' });
    }
    const data = reportService.getRadarChartData(req.params.restaurantId);
    if (!data) {
      return res.status(404).json({ error: '获取图表数据失败' });
    }
    res.json({ chart_data: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/chart/line/:restaurantId', auth, (req, res) => {
  try {
    const restaurant = Restaurant.findById(req.params.restaurantId);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限查看' });
    }
    const data = reportService.getLineChartData(req.params.restaurantId);
    if (!data) {
      return res.status(404).json({ error: '获取图表数据失败' });
    }
    res.json({ chart_data: data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/export/:restaurantId', auth, async (req, res) => {
  try {
    const restaurant = Restaurant.findById(req.params.restaurantId);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限导出' });
    }
    const result = await reportService.exportWeeklyReportPDF(req.params.restaurantId);
    if (!result.success) {
      return res.status(500).json({ error: result.error });
    }
    res.download(result.filepath, result.filename, (err) => {
      if (err) {
        console.error(err);
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
