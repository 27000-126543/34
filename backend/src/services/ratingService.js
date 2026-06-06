const Dish = require('../models/Dish');
const Chef = require('../models/Chef');
const Restaurant = require('../models/Restaurant');
const Inventory = require('../models/Inventory');
const Ingredient = require('../models/Ingredient');

const ratingService = {
  calculateDishRating: (freshness, chefSkill, ingredientQuality) => {
    const normalizedFreshness = Math.min(100, Math.max(0, freshness)) / 100;
    const normalizedSkill = Math.min(100, Math.max(0, chefSkill)) / 100;
    const normalizedQuality = Math.min(100, Math.max(0, ingredientQuality)) / 100;
    const score = (normalizedFreshness * 0.3 + normalizedSkill * 0.4 + normalizedQuality * 0.3) * 5;
    return Math.round(score * 10) / 10;
  },

  calculateDishRatingForRestaurant: (dishId, chefId) => {
    const dish = Dish.findById(dishId);
    const chef = Chef.findById(chefId);
    if (!dish || !chef) return null;

    const ingredients = dish.ingredients_json || [];
    if (ingredients.length === 0) {
      return ratingService.calculateDishRating(80, chef.skill, 80);
    }

    let totalFreshness = 0;
    let totalQuality = 0;
    let count = 0;

    for (const ing of ingredients) {
      const inventory = Inventory.findByRestaurantAndIngredient(chef.restaurant_id, ing.ingredient_id);
      const ingredient = Ingredient.findById(ing.ingredient_id);
      if (inventory && ingredient) {
        totalFreshness += inventory.freshness;
        totalQuality += Math.min(100, (ingredient.rarity * 25) + 50);
        count++;
      }
    }

    const avgFreshness = count > 0 ? totalFreshness / count : 80;
    const avgQuality = count > 0 ? totalQuality / count : 80;

    return ratingService.calculateDishRating(avgFreshness, chef.skill, avgQuality);
  },

  calculateRestaurantRating: (restaurantId) => {
    const dishes = Dish.findByRestaurantId(restaurantId);
    if (dishes.length === 0) return 0;

    let totalRating = 0;
    let totalWeight = 0;

    for (const dish of dishes) {
      const weight = dish.sales_count + 1;
      totalRating += dish.rating * weight;
      totalWeight += weight;
    }

    const avgRating = totalRating > 0 ? totalRating / totalWeight : 0;
    const chefs = Chef.findByRestaurantId(restaurantId);
    const avgChefSkill = chefs.length > 0
      ? chefs.reduce((sum, c) => sum + c.skill, 0) / chefs.length
      : 50;
    const chefBonus = (avgChefSkill / 100) * 0.5;

    const finalRating = Math.min(5, avgRating + chefBonus);
    return Math.round(finalRating * 10) / 10;
  },

  updateRestaurantRating: (restaurantId) => {
    const newRating = ratingService.calculateRestaurantRating(restaurantId);
    Restaurant.updateRating(restaurantId, newRating);
    return newRating;
  },

  updateDishRating: (dishId, chefId) => {
    const newRating = ratingService.calculateDishRatingForRestaurant(dishId, chefId);
    if (newRating !== null) {
      const dish = Dish.update(dishId, { rating: newRating });
      const restaurant = Restaurant.findById(dish.restaurant_id);
      if (restaurant) {
        ratingService.updateRestaurantRating(restaurant.id);
      }
      return newRating;
    }
    return null;
  }
};

module.exports = ratingService;
