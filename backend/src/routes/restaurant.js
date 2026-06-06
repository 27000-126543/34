const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Restaurant = require('../models/Restaurant');
const Inventory = require('../models/Inventory');
const ratingService = require('../services/ratingService');

router.get('/', auth, (req, res) => {
  try {
    const restaurants = Restaurant.findByOwnerId(req.player.id);
    res.json({ restaurants });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/all', auth, (req, res) => {
  try {
    const restaurants = Restaurant.findAll();
    res.json({ restaurants });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, (req, res) => {
  try {
    const restaurant = Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: '餐厅不存在' });
    }
    res.json({ restaurant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { name, cuisine_type, decor_style } = req.body;
    if (!name || !cuisine_type || !decor_style) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }
    const validCuisines = ['chinese', 'french', 'italian', 'japanese', 'mexican', 'indian'];
    const validDecor = ['modern', 'classic', 'casual', 'luxury', 'ethnic'];
    if (!validCuisines.includes(cuisine_type)) {
      return res.status(400).json({ error: '无效的菜系类型' });
    }
    if (!validDecor.includes(decor_style)) {
      return res.status(400).json({ error: '无效的装潢风格' });
    }
    const restaurant = Restaurant.create(req.player.id, name, cuisine_type, decor_style);
    res.json({ restaurant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    const restaurant = Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: '餐厅不存在' });
    }
    if (restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限修改该餐厅' });
    }
    const updated = Restaurant.update(req.params.id, req.body);
    res.json({ restaurant: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id/inventory', auth, (req, res) => {
  try {
    const restaurant = Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: '餐厅不存在' });
    }
    if (restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限查看该餐厅库存' });
    }
    const inventory = Inventory.findByRestaurantId(req.params.id);
    const totalValue = Inventory.getTotalValue(req.params.id);
    res.json({ inventory, total_value: totalValue });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/refresh-rating', auth, (req, res) => {
  try {
    const restaurant = Restaurant.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: '餐厅不存在' });
    }
    if (restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限' });
    }
    const newRating = ratingService.updateRestaurantRating(req.params.id);
    res.json({ new_rating: newRating });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
