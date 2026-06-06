const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Chef = require('../models/Chef');
const Restaurant = require('../models/Restaurant');
const chefService = require('../services/chefService');

router.get('/restaurant/:restaurantId', auth, (req, res) => {
  try {
    const restaurant = Restaurant.findById(req.params.restaurantId);
    if (!restaurant) {
      return res.status(404).json({ error: '餐厅不存在' });
    }
    if (restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限查看' });
    }
    const chefs = Chef.findByRestaurantId(req.params.restaurantId);
    const avgSkill = chefService.getAverageChefSkill(req.params.restaurantId);
    const bestChef = chefService.getBestChef(req.params.restaurantId);
    res.json({ chefs, avg_skill: avgSkill, best_chef: bestChef });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, (req, res) => {
  try {
    const chef = Chef.findById(req.params.id);
    if (!chef) {
      return res.status(404).json({ error: '厨师不存在' });
    }
    res.json({ chef });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { restaurant_id, name } = req.body;
    if (!restaurant_id || !name) {
      return res.status(400).json({ error: '请提供餐厅ID和厨师姓名' });
    }
    const restaurant = Restaurant.findById(restaurant_id);
    if (!restaurant) {
      return res.status(404).json({ error: '餐厅不存在' });
    }
    if (restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限招聘厨师' });
    }
    const result = chefService.hireChef(restaurant_id, name);
    if (result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ chef: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    const chef = Chef.findById(req.params.id);
    if (!chef) {
      return res.status(404).json({ error: '厨师不存在' });
    }
    const restaurant = Restaurant.findById(chef.restaurant_id);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限修改' });
    }
    const updated = Chef.update(req.params.id, req.body);
    res.json({ chef: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    const chef = Chef.findById(req.params.id);
    if (!chef) {
      return res.status(404).json({ error: '厨师不存在' });
    }
    const restaurant = Restaurant.findById(chef.restaurant_id);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限解雇' });
    }
    const result = chefService.fireChef(req.params.id);
    if (result && result.error) {
      return res.status(400).json({ error: result.error });
    }
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/promote/approve', auth, (req, res) => {
  try {
    const chef = Chef.findById(req.params.id);
    if (!chef) {
      return res.status(404).json({ error: '厨师不存在' });
    }
    const restaurant = Restaurant.findById(chef.restaurant_id);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限审批' });
    }
    const promoted = chefService.approvePromotion(req.params.id);
    if (!promoted) {
      return res.status(400).json({ error: '该厨师没有待审批的晋升' });
    }
    res.json({ chef: promoted });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/promote/reject', auth, (req, res) => {
  try {
    const chef = Chef.findById(req.params.id);
    if (!chef) {
      return res.status(404).json({ error: '厨师不存在' });
    }
    const restaurant = Restaurant.findById(chef.restaurant_id);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限审批' });
    }
    const result = chefService.rejectPromotion(req.params.id);
    res.json({ chef: result });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/pending/:restaurantId', auth, (req, res) => {
  try {
    const restaurant = Restaurant.findById(req.params.restaurantId);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限查看' });
    }
    const pending = chefService.getPendingPromotions(req.params.restaurantId);
    res.json({ pending_promotions: pending });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
