const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Ingredient = require('../models/Ingredient');
const Restaurant = require('../models/Restaurant');
const marketService = require('../services/marketService');

let io;

const setIo = (socketIo) => {
  io = socketIo;
};

router.get('/ingredients', auth, (req, res) => {
  try {
    const { category } = req.query;
    let ingredients;
    if (category) {
      ingredients = Ingredient.findByCategory(category);
    } else {
      ingredients = Ingredient.findAll();
    }
    res.json({ ingredients });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/ingredients/:id', auth, (req, res) => {
  try {
    const ingredient = Ingredient.findById(req.params.id);
    if (!ingredient) {
      return res.status(404).json({ error: '食材不存在' });
    }
    res.json({ ingredient });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/summary', auth, (req, res) => {
  try {
    const summary = marketService.getMarketSummary();
    res.json({ market_summary: summary });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/transactions', auth, (req, res) => {
  try {
    const { limit } = req.query;
    const transactions = marketService.getRecentTransactions(parseInt(limit) || 20);
    res.json({ transactions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/update-prices', auth, (req, res) => {
  try {
    const updated = marketService.updateMarketPrices();
    if (io) {
      io.emit('market:update', { type: 'price_update', data: updated });
    }
    res.json({ updated_count: updated.length, updates: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/seasonal-event', auth, (req, res) => {
  try {
    const result = marketService.triggerSeasonalEvent();
    if (io) {
      io.emit('market:update', { type: 'seasonal_event', data: result });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/buy', auth, (req, res) => {
  try {
    const { restaurant_id, ingredient_id, quantity } = req.body;
    if (!restaurant_id || !ingredient_id || !quantity) {
      return res.status(400).json({ error: '请提供所有必填参数' });
    }
    const restaurant = Restaurant.findById(restaurant_id);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限操作' });
    }
    const result = marketService.buyIngredient(restaurant_id, ingredient_id, quantity);
    if (result.success && io) {
      io.emit('market:update', { type: 'purchase', data: result });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/sell', auth, (req, res) => {
  try {
    const { restaurant_id, ingredient_id, quantity } = req.body;
    if (!restaurant_id || !ingredient_id || !quantity) {
      return res.status(400).json({ error: '请提供所有必填参数' });
    }
    const restaurant = Restaurant.findById(restaurant_id);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限操作' });
    }
    const result = marketService.sellIngredient(restaurant_id, ingredient_id, quantity);
    if (result.success && io) {
      io.emit('market:update', { type: 'sale', data: result });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/trade', auth, (req, res) => {
  try {
    const { buyer_restaurant_id, seller_restaurant_id, ingredient_id, quantity, agreed_price } = req.body;
    if (!buyer_restaurant_id || !seller_restaurant_id || !ingredient_id || !quantity || !agreed_price) {
      return res.status(400).json({ error: '请提供所有必填参数' });
    }
    const buyer = Restaurant.findById(buyer_restaurant_id);
    if (!buyer || buyer.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限操作' });
    }
    const result = marketService.tradeBetweenRestaurants(
      buyer_restaurant_id,
      seller_restaurant_id,
      ingredient_id,
      quantity,
      agreed_price
    );
    if (result.success && io) {
      io.emit('market:update', { type: 'trade', data: result });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = { router, setIo };
