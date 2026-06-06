const Restaurant = require('../models/Restaurant');
const Chef = require('../models/Chef');
const Player = require('../models/Player');
const Dish = require('../models/Dish');
const Alliance = require('../models/Alliance');

const leaderboardService = {
  getProfitLeaderboard: (limit = 20) => {
    const restaurants = Restaurant.findAll();
    const ranked = restaurants.slice(0, limit).map((r, index) => {
      const owner = Player.findById(r.owner_id);
      return {
        rank: index + 1,
        restaurant_id: r.id,
        restaurant_name: r.name,
        owner_id: r.owner_id,
        owner_name: owner?.username || '未知',
        total_profit: r.total_profit,
        level: r.level,
        cuisine_type: r.cuisine_type,
        avg_rating: r.avg_rating
      };
    });
    return ranked;
  },

  getRatingLeaderboard: (limit = 20) => {
    const restaurants = Restaurant.findAll();
    restaurants.sort((a, b) => b.avg_rating - a.avg_rating);
    return restaurants.slice(0, limit).map((r, index) => {
      const owner = Player.findById(r.owner_id);
      return {
        rank: index + 1,
        restaurant_id: r.id,
        restaurant_name: r.name,
        owner_id: r.owner_id,
        owner_name: owner?.username || '未知',
        avg_rating: r.avg_rating,
        level: r.level,
        cuisine_type: r.cuisine_type,
        total_profit: r.total_profit
      };
    });
  },

  getChefLevelLeaderboard: (limit = 20) => {
    const restaurants = Restaurant.findAll();
    const chefStats = restaurants.map(r => {
      const chefs = Chef.findByRestaurantId(r.id);
      const totalLevel = chefs.reduce((sum, chef) => {
        const levelMap = { apprentice: 1, head_chef: 2, master: 3 };
        return sum + (levelMap[chef.level] || 0);
      }, 0);
      const totalSkill = chefs.reduce((sum, chef) => sum + chef.skill, 0);
      return {
        restaurant_id: r.id,
        restaurant_name: r.name,
        chef_count: chefs.length,
        total_chef_level: totalLevel,
        total_skill: totalSkill,
        avg_skill: chefs.length > 0 ? Math.round(totalSkill / chefs.length) : 0
      };
    });

    chefStats.sort((a, b) => b.total_chef_level - a.total_chef_level || b.total_skill - a.total_skill);
    return chefStats.slice(0, limit).map((stat, index) => ({
      rank: index + 1,
      ...stat
    }));
  },

  getPlayerReputationLeaderboard: (limit = 20) => {
    const players = Player.findAll();
    return players.slice(0, limit).map((p, index) => ({
      rank: index + 1,
      player_id: p.id,
      username: p.username,
      reputation: p.reputation,
      coins: p.coins,
      research_points: p.research_points
    }));
  },

  getDishPopularityLeaderboard: (limit = 20) => {
    const dishes = Dish.findAll();
    dishes.sort((a, b) => b.sales_count - a.sales_count);
    return dishes.slice(0, limit).map((d, index) => {
      const restaurant = Restaurant.findById(d.restaurant_id);
      return {
        rank: index + 1,
        dish_id: d.id,
        dish_name: d.name,
        restaurant_id: d.restaurant_id,
        restaurant_name: restaurant?.name || '未知',
        cuisine_type: d.cuisine_type,
        sales_count: d.sales_count,
        rating: d.rating,
        is_rare: d.is_rare,
        base_price: d.base_price
      };
    });
  },

  getAllianceLeaderboard: (limit = 10) => {
    const alliances = Alliance.findAll();
    const ranked = alliances.map(a => {
      let totalReputation = 0;
      let totalCoins = 0;
      let memberCount = a.members_json.length;

      for (const memberId of a.members_json) {
        const player = Player.findById(memberId);
        if (player) {
          totalReputation += player.reputation;
          totalCoins += player.coins;
        }
      }

      return {
        alliance_id: a.id,
        alliance_name: a.name,
        member_count: memberCount,
        total_reputation: totalReputation,
        total_coins: totalCoins,
        avg_reputation: memberCount > 0 ? Math.round(totalReputation / memberCount) : 0,
        created_at: a.created_at
      };
    });

    ranked.sort((a, b) => b.total_reputation - a.total_reputation);
    return ranked.slice(0, limit).map((a, index) => ({
      rank: index + 1,
      ...a
    }));
  },

  getCuisineTypeLeaderboard: () => {
    const restaurants = Restaurant.findAll();
    const cuisineStats = {};
    const validTypes = ['chinese', 'french', 'italian', 'japanese', 'mexican', 'indian'];

    for (const type of validTypes) {
      cuisineStats[type] = {
        count: 0,
        total_profit: 0,
        total_rating: 0,
        total_level: 0
      };
    }

    for (const r of restaurants) {
      if (cuisineStats[r.cuisine_type]) {
        cuisineStats[r.cuisine_type].count++;
        cuisineStats[r.cuisine_type].total_profit += r.total_profit;
        cuisineStats[r.cuisine_type].total_rating += r.avg_rating;
        cuisineStats[r.cuisine_type].total_level += r.level;
      }
    }

    return Object.entries(cuisineStats).map(([type, stats]) => ({
      cuisine_type: type,
      restaurant_count: stats.count,
      avg_profit: stats.count > 0 ? Math.round(stats.total_profit / stats.count) : 0,
      avg_rating: stats.count > 0 ? Math.round(stats.total_rating / stats.count * 10) / 10 : 0,
      avg_level: stats.count > 0 ? Math.round(stats.total_level / stats.count * 10) / 10 : 0
    })).sort((a, b) => b.avg_rating - a.avg_rating);
  },

  getPlayerRank: (playerId) => {
    const profitBoard = leaderboardService.getProfitLeaderboard(1000);
    const reputationBoard = leaderboardService.getPlayerReputationLeaderboard(1000);

    const profitRank = profitBoard.findIndex(r => r.owner_id === playerId);
    const reputationRank = reputationBoard.findIndex(p => p.player_id === playerId);

    return {
      profit_rank: profitRank >= 0 ? profitRank + 1 : null,
      reputation_rank: reputationRank >= 0 ? reputationRank + 1 : null,
      total_restaurants: profitBoard.length,
      total_players: reputationBoard.length
    };
  },

  getAllLeaderboards: () => {
    return {
      profit: leaderboardService.getProfitLeaderboard(10),
      rating: leaderboardService.getRatingLeaderboard(10),
      chef_level: leaderboardService.getChefLevelLeaderboard(10),
      reputation: leaderboardService.getPlayerReputationLeaderboard(10),
      dish_popularity: leaderboardService.getDishPopularityLeaderboard(10),
      alliance: leaderboardService.getAllianceLeaderboard(5),
      cuisine_stats: leaderboardService.getCuisineTypeLeaderboard()
    };
  }
};

module.exports = leaderboardService;
