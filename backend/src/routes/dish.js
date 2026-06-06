const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const Dish = require('../models/Dish');
const Restaurant = require('../models/Restaurant');
const Recipe = require('../models/Recipe');
const ChefEquipment = require('../models/ChefEquipment');
const ratingService = require('../services/ratingService');
const researchService = require('../services/researchService');

router.get('/', auth, (req, res) => {
  try {
    const dishes = Dish.findAll();
    res.json({ dishes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/recipes', auth, (req, res) => {
  try {
    const { cuisine_type, max_difficulty } = req.query;
    const recipes = researchService.getAvailableRecipes(cuisine_type, max_difficulty ? parseInt(max_difficulty) : null);
    res.json({ recipes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/equipment', auth, (req, res) => {
  try {
    const { type } = req.query;
    let equipment;
    if (type) {
      equipment = ChefEquipment.findByType(type);
    } else {
      equipment = ChefEquipment.findAll();
    }
    res.json({ equipment });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/restaurant/:restaurantId', auth, (req, res) => {
  try {
    const dishes = Dish.findByRestaurantId(req.params.restaurantId);
    res.json({ dishes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, (req, res) => {
  try {
    const dish = Dish.findById(req.params.id);
    if (!dish) {
      return res.status(404).json({ error: '菜品不存在' });
    }
    res.json({ dish });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/develop', auth, (req, res) => {
  try {
    const { restaurant_id, recipe_id, chef_id } = req.body;
    if (!restaurant_id || !recipe_id || !chef_id) {
      return res.status(400).json({ error: '请提供所有必填参数' });
    }
    const result = researchService.developDish(req.player.id, restaurant_id, recipe_id, chef_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/unlock-recipe', auth, (req, res) => {
  try {
    const { recipe_id } = req.body;
    if (!recipe_id) {
      return res.status(400).json({ error: '请提供食谱ID' });
    }
    const result = researchService.unlockRecipe(req.player.id, recipe_id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/research-points', auth, (req, res) => {
  try {
    const { target_id, amount, type } = req.body;
    if (!target_id || !amount || !type) {
      return res.status(400).json({ error: '请提供所有必填参数' });
    }
    const result = researchService.distributeResearchPoints(req.player.id, target_id, amount, type);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, (req, res) => {
  try {
    const { restaurant_id, name, cuisine_type, ingredients_json, base_price, is_rare } = req.body;
    if (!restaurant_id || !name || !cuisine_type || !base_price) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }
    const restaurant = Restaurant.findById(restaurant_id);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限创建菜品' });
    }
    const dish = Dish.create(restaurant_id, name, cuisine_type, ingredients_json || [], base_price, is_rare || false);
    res.json({ dish });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, (req, res) => {
  try {
    const dish = Dish.findById(req.params.id);
    if (!dish) {
      return res.status(404).json({ error: '菜品不存在' });
    }
    const restaurant = Restaurant.findById(dish.restaurant_id);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限修改' });
    }
    const updated = Dish.update(req.params.id, req.body);
    res.json({ dish: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, (req, res) => {
  try {
    const dish = Dish.findById(req.params.id);
    if (!dish) {
      return res.status(404).json({ error: '菜品不存在' });
    }
    const restaurant = Restaurant.findById(dish.restaurant_id);
    if (!restaurant || restaurant.owner_id !== req.player.id) {
      return res.status(403).json({ error: '无权限删除' });
    }
    Dish.delete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/refresh-rating', auth, (req, res) => {
  try {
    const dish = Dish.findById(req.params.id);
    if (!dish) {
      return res.status(404).json({ error: '菜品不存在' });
    }
    const { chef_id } = req.body;
    if (!chef_id) {
      return res.status(400).json({ error: '请提供厨师ID' });
    }
    const newRating = ratingService.updateDishRating(req.params.id, chef_id);
    res.json({ new_rating: newRating });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
