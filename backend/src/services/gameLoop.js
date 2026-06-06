const database = require('../config/database');
const Inventory = require('../models/Inventory');
const Restaurant = require('../models/Restaurant');
const Chef = require('../models/Chef');
const Dish = require('../models/Dish');
const Competition = require('../models/Competition');
const ratingService = require('./ratingService');
const competitionService = require('./competitionService');

const getDb = () => database.db;

let inventoryTimer = null;
let ratingTimer = null;
let competitionTimer = null;

const processInventoryTick = (io) => {
  const db = getDb();
  if (!db) return;

  const allInventory = db.prepare('SELECT * FROM inventory').all();
  const updatedRestaurants = new Set();

  for (const item of allInventory) {
    const newFreshness = item.freshness - 1;
    if (newFreshness <= 0) {
      db.prepare('DELETE FROM inventory WHERE id = ?').run(item.id);
    } else {
      db.prepare('UPDATE inventory SET freshness = ? WHERE id = ?').run(newFreshness, item.id);
    }
    updatedRestaurants.add(item.restaurant_id);
  }

  for (const restaurantId of updatedRestaurants) {
    const updatedInventory = Inventory.findByRestaurantId(restaurantId);
    io.to(`restaurant:${restaurantId}`).emit('inventory:update', {
      restaurant_id: restaurantId,
      inventory: updatedInventory
    });
  }
};

const processRatingTick = (io) => {
  const restaurants = Restaurant.findAll();

  for (const restaurant of restaurants) {
    const chefs = Chef.findByRestaurantId(restaurant.id);
    const dishes = Dish.findByRestaurantId(restaurant.id);

    if (chefs.length === 0 || dishes.length === 0) continue;

    const firstChef = chefs[0];
    for (const dish of dishes) {
      ratingService.updateDishRating(dish.id, firstChef.id);
    }

    const updatedRestaurant = Restaurant.findById(restaurant.id);
    io.to(`restaurant:${restaurant.id}`).emit('restaurant:update', {
      restaurant: updatedRestaurant
    });
  }
};

const processCompetitionTick = (io) => {
  const activeCompetitions = Competition.findByStatus('active');

  for (const competition of activeCompetitions) {
    const participants = competitionService.calculateRealTimeMetrics(competition.id);
    if (participants && participants.length > 0) {
      io.to(`competition:${competition.id}`).emit('competition:realtime', {
        competition_id: competition.id,
        participants: participants
      });
    }
  }
};

const startGameLoop = (io) => {
  stopGameLoop();

  inventoryTimer = setInterval(() => {
    try {
      processInventoryTick(io);
    } catch (e) {
      console.error('Inventory tick error:', e);
    }
  }, 5000);

  ratingTimer = setInterval(() => {
    try {
      processRatingTick(io);
    } catch (e) {
      console.error('Rating tick error:', e);
    }
  }, 10000);

  competitionTimer = setInterval(() => {
    try {
      processCompetitionTick(io);
    } catch (e) {
      console.error('Competition tick error:', e);
    }
  }, 3000);

  return { inventoryTimer, ratingTimer, competitionTimer };
};

const stopGameLoop = () => {
  if (inventoryTimer) {
    clearInterval(inventoryTimer);
    inventoryTimer = null;
  }
  if (ratingTimer) {
    clearInterval(ratingTimer);
    ratingTimer = null;
  }
  if (competitionTimer) {
    clearInterval(competitionTimer);
    competitionTimer = null;
  }
};

module.exports = {
  startGameLoop,
  stopGameLoop,
  get inventoryTimer() { return inventoryTimer; },
  get ratingTimer() { return ratingTimer; },
  get competitionTimer() { return competitionTimer; }
};
