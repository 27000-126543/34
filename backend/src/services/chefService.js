const Chef = require('../models/Chef');
const Restaurant = require('../models/Restaurant');

const LEVEL_EXP_REQUIREMENTS = {
  apprentice: 1000,
  head_chef: 5000,
  master: Infinity
};

const LEVEL_SKILL_BONUS = {
  apprentice: 10,
  head_chef: 15,
  master: 25
};

const chefService = {
  getExpForNextLevel: (currentLevel) => {
    return LEVEL_EXP_REQUIREMENTS[currentLevel] || 0;
  },

  calculateExpGain: (dishDifficulty, dishRating, baseExp = 50) => {
    const difficultyMultiplier = 1 + (dishDifficulty - 1) * 0.3;
    const ratingMultiplier = 1 + (dishRating - 3) * 0.2;
    return Math.round(baseExp * difficultyMultiplier * ratingMultiplier);
  },

  addExp: (chefId, expAmount) => {
    const chef = Chef.findById(chefId);
    if (!chef) return null;

    const newExp = chef.exp + expAmount;
    let updatedChef = Chef.addExp(chefId, expAmount);

    const expNeeded = chefService.getExpForNextLevel(chef.level);
    if (newExp >= expNeeded && chef.level !== 'master') {
      updatedChef = Chef.update(chefId, {
        exp: newExp,
        pending_promotion: 1
      });
    }

    return updatedChef;
  },

  approvePromotion: (chefId) => {
    const chef = Chef.findById(chefId);
    if (!chef || !chef.pending_promotion) return null;

    let newLevel = chef.level;
    if (chef.level === 'apprentice') newLevel = 'head_chef';
    else if (chef.level === 'head_chef') newLevel = 'master';

    const skillBonus = LEVEL_SKILL_BONUS[newLevel] - (LEVEL_SKILL_BONUS[chef.level] || 0);
    const newSkill = Math.min(100, chef.skill + skillBonus);

    return Chef.update(chefId, {
      level: newLevel,
      skill: newSkill,
      pending_promotion: 0
    });
  },

  rejectPromotion: (chefId) => {
    const chef = Chef.findById(chefId);
    if (!chef) return null;
    const reducedExp = Math.floor(chef.exp * 0.8);
    return Chef.update(chefId, {
      exp: reducedExp,
      pending_promotion: 0
    });
  },

  getPendingPromotions: (restaurantId) => {
    return Chef.findAllPendingPromotion(restaurantId);
  },

  getAverageChefSkill: (restaurantId) => {
    const chefs = Chef.findByRestaurantId(restaurantId);
    if (chefs.length === 0) return 0;
    const total = chefs.reduce((sum, chef) => sum + chef.skill, 0);
    return Math.round(total / chefs.length);
  },

  getBestChef: (restaurantId) => {
    const chefs = Chef.findByRestaurantId(restaurantId);
    if (chefs.length === 0) return null;
    return chefs.reduce((best, chef) => chef.skill > best.skill ? chef : best, chefs[0]);
  },

  assignChefToDish: (chefId, difficulty) => {
    const chef = Chef.findById(chefId);
    if (!chef) return 0;

    const levelMap = { apprentice: 1, head_chef: 2, master: 3 };
    const chefLevel = levelMap[chef.level] || 1;
    const difficultyGap = Math.max(0, difficulty - chefLevel);

    if (difficultyGap === 0) return chef.skill;
    if (difficultyGap === 1) return Math.round(chef.skill * 0.75);
    return Math.round(chef.skill * 0.5);
  },

  hireChef: (restaurantId, name) => {
    const chefs = Chef.findByRestaurantId(restaurantId);
    const restaurant = Restaurant.findById(restaurantId);
    if (!restaurant) return null;

    const maxChefs = restaurant.level * 2;
    if (chefs.length >= maxChefs) {
      return { error: '厨师数量已达上限，请先升级餐厅' };
    }

    const newChef = Chef.create(restaurantId, name);
    return newChef;
  },

  fireChef: (chefId) => {
    const chef = Chef.findById(chefId);
    if (!chef) return false;

    const chefs = Chef.findByRestaurantId(chef.restaurant_id);
    if (chefs.length <= 1) {
      return { error: '至少需要保留一名厨师' };
    }

    return Chef.delete(chefId);
  }
};

module.exports = chefService;
