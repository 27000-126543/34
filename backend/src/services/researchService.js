const Player = require('../models/Player');
const Recipe = require('../models/Recipe');
const Dish = require('../models/Dish');
const Chef = require('../models/Chef');
const Restaurant = require('../models/Restaurant');
const Inventory = require('../models/Inventory');

const researchService = {
  calculateResearchSuccessRate: (chefId, recipeDifficulty) => {
    const chef = Chef.findById(chefId);
    if (!chef) return 0.05;

    const rate = 0.5 + chef.skill * 0.003;
    return Math.max(0.05, Math.min(0.95, rate));
  },

  unlockRecipe: (playerId, recipeId) => {
    const player = Player.findById(playerId);
    const recipe = Recipe.findById(recipeId);

    if (!player || !recipe) {
      return { success: false, error: '玩家或食谱不存在' };
    }

    if (!recipe.is_unlockable) {
      return { success: false, error: '该食谱无法解锁' };
    }

    if (player.research_points < recipe.cost_points) {
      return { success: false, error: '研究点不足' };
    }

    Player.updateResearchPoints(playerId, -recipe.cost_points);
    const updatedPlayer = Player.findById(playerId);
    return { success: true, recipe, remainingPoints: updatedPlayer.research_points };
  },

  developDish: (playerId, restaurantId, recipeId, chefId) => {
    const recipe = Recipe.findById(recipeId);
    const chef = Chef.findById(chefId);
    const restaurant = Restaurant.findById(restaurantId);
    const player = Player.findById(playerId);

    if (!recipe || !chef || !restaurant || !player) {
      return { success: false, error: '参数无效' };
    }

    if (chef.restaurant_id !== restaurantId) {
      return { success: false, error: '厨师不属于该餐厅' };
    }

    if (restaurant.owner_id !== playerId) {
      return { success: false, error: '不是餐厅所有者' };
    }

    const ingredients = recipe.ingredients_json || [];
    const successRate = researchService.calculateResearchSuccessRate(chefId, recipe.difficulty);
    const roll = Math.random();

    for (const ing of ingredients) {
      const inventoryItem = Inventory.findByRestaurantAndIngredient(restaurantId, ing.ingredient_id);
      if (!inventoryItem || inventoryItem.quantity < ing.quantity) {
        return {
          success: false,
          error: `食材不足: 食材ID ${ing.ingredient_id} 库存不足`,
          successRate: Math.round(successRate * 100),
          roll: Math.round(roll * 100)
        };
      }
    }

    const developmentCost = recipe.difficulty * 30;
    if (player.research_points < developmentCost) {
      return {
        success: false,
        error: '研究点不足，需要 ' + developmentCost + ' 点',
        successRate: Math.round(successRate * 100),
        roll: Math.round(roll * 100)
      };
    }

    Player.updateResearchPoints(playerId, -developmentCost);

    for (const ing of ingredients) {
      const inventoryItem = Inventory.findByRestaurantAndIngredient(restaurantId, ing.ingredient_id);
      if (inventoryItem) {
        Inventory.updateQuantity(inventoryItem.id, -ing.quantity);
      }
    }

    const isSuccess = roll < successRate;

    if (isSuccess) {
      const isRare = Math.random() < (recipe.rarity * 0.1);
      const basePrice = Math.round(recipe.difficulty * 25 * (1 + recipe.rarity * 0.3));
      const newDish = Dish.create(
        restaurantId,
        recipe.name,
        recipe.cuisine_type,
        recipe.ingredients_json,
        basePrice,
        isRare
      );

      Chef.addExp(chefId, recipe.difficulty * 100);

      return {
        success: true,
        dish: newDish,
        successRate: Math.round(successRate * 100),
        roll: Math.round(roll * 100),
        isRare
      };
    }

    const returnedIngredients = [];
    for (const ing of ingredients) {
      const returnQuantity = Math.floor(ing.quantity * 0.5);
      if (returnQuantity > 0) {
        Inventory.create(restaurantId, ing.ingredient_id, returnQuantity);
        returnedIngredients.push({
          ingredient_id: ing.ingredient_id,
          quantity: returnQuantity
        });
      }
    }

    Chef.addExp(chefId, recipe.difficulty * 30);

    return {
      success: false,
      error: '研发失败',
      successRate: Math.round(successRate * 100),
      roll: Math.round(roll * 100),
      returned_ingredients: returnedIngredients
    };
  },

  distributeResearchPoints: (playerId, targetId, amount, type) => {
    const player = Player.findById(playerId);
    if (!player) return { success: false, error: '玩家不存在' };
    if (player.research_points < amount) {
      return { success: false, error: '研究点不足' };
    }

    if (type === 'chef') {
      const chef = Chef.findById(targetId);
      if (!chef) return { success: false, error: '厨师不存在' };

      const skillGain = Math.min(Math.floor(amount / 20), 10);
      Chef.update(targetId, { skill: Math.min(100, chef.skill + skillGain) });
      Player.updateResearchPoints(playerId, -amount);
      const updatedPlayer = Player.findById(playerId);

      return { success: true, skillGain, remainingPoints: updatedPlayer.research_points };
    }

    return { success: false, error: '无效的分配类型' };
  },

  getAvailableRecipes: (cuisineType = null, maxDifficulty = null) => {
    let recipes;
    if (cuisineType) {
      recipes = Recipe.findByCuisineType(cuisineType);
    } else {
      recipes = Recipe.findAll();
    }
    if (maxDifficulty !== null) {
      recipes = recipes.filter(r => r.difficulty <= maxDifficulty);
    }
    return recipes;
  }
};

module.exports = researchService;
