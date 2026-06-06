const express = require('express');
const router = express.Router();
const Player = require('../models/Player');
const Restaurant = require('../models/Restaurant');
const Chef = require('../models/Chef');
const Dish = require('../models/Dish');
const { generateToken, auth } = require('../middleware/auth');

const getPlayerFullData = (playerId) => {
  const player = Player.findById(playerId);
  const restaurants = Restaurant.findByOwnerId(playerId);
  let restaurant = null;
  let chefs = [];
  let dishes = [];
  if (restaurants.length > 0) {
    restaurant = restaurants[0];
    chefs = Chef.findByRestaurantId(restaurant.id);
    dishes = Dish.findByRestaurantId(restaurant.id);
    restaurant.chefs = chefs;
    restaurant.dishes = dishes;
  }
  return { player, restaurant, chefs, dishes };
};

router.post('/register', (req, res) => {
  try {
    const { username, email, password, restaurant_name, cuisine_type, decor_style } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ error: '请填写所有必填字段' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: '密码至少需要6位' });
    }
    if (Player.findByUsername(username)) {
      return res.status(400).json({ error: '用户名已被使用' });
    }
    if (Player.findByEmail(email)) {
      return res.status(400).json({ error: '邮箱已被注册' });
    }
    const player = Player.create(username, email, password);
    const token = generateToken(player.id);

    let restaurant = null;
    if (restaurant_name && cuisine_type && decor_style) {
      restaurant = Restaurant.create(player.id, restaurant_name, cuisine_type, decor_style);
      Chef.create(restaurant.id, '主厨 ' + username);
    }

    res.json({ player, token, restaurant });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: '请输入用户名和密码' });
    }
    const player = Player.findByUsername(username);
    if (!player || !Player.verifyPassword(player, password)) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }
    const token = generateToken(player.id);
    const fullData = getPlayerFullData(player.id);
    res.json({ ...fullData, token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/me', auth, (req, res) => {
  try {
    const fullData = getPlayerFullData(req.player.id);
    res.json(fullData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/profile', auth, (req, res) => {
  try {
    const player = Player.findById(req.player.id);
    res.json({ player });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/logout', auth, (req, res) => {
  res.json({ success: true });
});

module.exports = router;
