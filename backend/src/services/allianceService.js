const Alliance = require('../models/Alliance');
const Player = require('../models/Player');
const Restaurant = require('../models/Restaurant');
const Inventory = require('../models/Inventory');
const Duel = require('../models/Duel');
const Dish = require('../models/Dish');
const Chef = require('../models/Chef');
const ratingService = require('./ratingService');

const allianceService = {
  createAlliance: (name, founderId) => {
    const existing = Alliance.findByName(name);
    if (existing) {
      return { success: false, error: '联盟名称已存在' };
    }

    const alliance = Alliance.create(name, founderId);
    const restaurants = Restaurant.findByOwnerId(founderId);
    for (const r of restaurants) {
      Restaurant.update(r.id, { alliance_id: alliance.id });
    }

    return { success: true, alliance };
  },

  joinAlliance: (allianceId, playerId) => {
    const alliance = Alliance.findById(allianceId);
    if (!alliance) {
      return { success: false, error: '联盟不存在' };
    }

    if (alliance.members_json.includes(playerId)) {
      return { success: false, error: '已加入该联盟' };
    }

    if (alliance.members_json.length >= 20) {
      return { success: false, error: '联盟成员已满' };
    }

    Alliance.addMember(allianceId, playerId);
    const restaurants = Restaurant.findByOwnerId(playerId);
    for (const r of restaurants) {
      Restaurant.update(r.id, { alliance_id: allianceId });
    }

    return { success: true, alliance: Alliance.findById(allianceId) };
  },

  leaveAlliance: (allianceId, playerId) => {
    const alliance = Alliance.findById(allianceId);
    if (!alliance) {
      return { success: false, error: '联盟不存在' };
    }

    if (playerId === alliance.founder_id) {
      return { success: false, error: '创始人不能退出联盟，请先转让或解散' };
    }

    Alliance.removeMember(allianceId, playerId);
    const restaurants = Restaurant.findByOwnerId(playerId);
    for (const r of restaurants) {
      Restaurant.update(r.id, { alliance_id: null });
    }

    return { success: true };
  },

  disbandAlliance: (allianceId, playerId) => {
    const alliance = Alliance.findById(allianceId);
    if (!alliance) {
      return { success: false, error: '联盟不存在' };
    }

    if (playerId !== alliance.founder_id) {
      return { success: false, error: '只有创始人可以解散联盟' };
    }

    for (const memberId of alliance.members_json) {
      const restaurants = Restaurant.findByOwnerId(memberId);
      for (const r of restaurants) {
        Restaurant.update(r.id, { alliance_id: null });
      }
    }

    Alliance.delete(allianceId);
    return { success: true };
  },

  getAllianceMembers: (allianceId) => {
    const alliance = Alliance.findById(allianceId);
    if (!alliance) return null;

    const members = alliance.members_json.map(id => {
      const player = Player.findById(id);
      const restaurants = Restaurant.findByOwnerId(id);
      return {
        player,
        restaurants,
        is_founder: id === alliance.founder_id
      };
    });

    return { alliance, members };
  },

  shareInventory: (fromRestaurantId, toRestaurantId, ingredientId, quantity, allianceId) => {
    const fromRestaurant = Restaurant.findById(fromRestaurantId);
    const toRestaurant = Restaurant.findById(toRestaurantId);

    if (!fromRestaurant || !toRestaurant) {
      return { success: false, error: '餐厅不存在' };
    }

    if (fromRestaurant.alliance_id !== allianceId || toRestaurant.alliance_id !== allianceId) {
      return { success: false, error: '餐厅不在同一联盟' };
    }

    const inventory = Inventory.findByRestaurantAndIngredient(fromRestaurantId, ingredientId);
    if (!inventory || inventory.quantity < quantity) {
      return { success: false, error: '库存不足' };
    }

    if (quantity <= 0) {
      return { success: false, error: '数量必须大于0' };
    }

    Inventory.updateQuantity(inventory.id, -quantity);
    Inventory.create(toRestaurantId, ingredientId, quantity, inventory.freshness);

    return {
      success: true,
      transferred: { ingredient_id: ingredientId, quantity }
    };
  },

  getAllianceInventory: (allianceId) => {
    const restaurants = Restaurant.findByAllianceId(allianceId);
    const allInventory = [];

    for (const r of restaurants) {
      const inv = Inventory.findByRestaurantId(r.id);
      for (const item of inv) {
        allInventory.push({
          ...item,
          restaurant_id: r.id,
          restaurant_name: r.name
        });
      }
    }

    return allInventory;
  },

  initiateDuel: (challengerRestaurantId, defenderRestaurantId) => {
    const challenger = Restaurant.findById(challengerRestaurantId);
    const defender = Restaurant.findById(defenderRestaurantId);

    if (!challenger || !defender) {
      return { success: false, error: '餐厅不存在' };
    }

    if (challenger.id === defender.id) {
      return { success: false, error: '不能与自己对决' };
    }

    if (challenger.alliance_id !== defender.alliance_id || !challenger.alliance_id) {
      return { success: false, error: '只能与同一联盟的成员对决' };
    }

    const activeDuels = Duel.findActiveByRestaurantId(challengerRestaurantId);
    if (activeDuels.length > 0) {
      return { success: false, error: '已有进行中的对决' };
    }

    const duel = Duel.create(challengerRestaurantId, defenderRestaurantId);
    return { success: true, duel };
  },

  executeDuel: (duelId) => {
    const duel = Duel.findById(duelId);
    if (!duel || duel.status !== 'active') {
      return { success: false, error: '对决不存在或已完成' };
    }

    const challengerDishes = Dish.findByRestaurantId(duel.challenger_id);
    const defenderDishes = Dish.findByRestaurantId(duel.defender_id);

    const rounds = [];
    let challengerWins = 0;
    let defenderWins = 0;
    let ties = 0;

    const roundCount = Math.min(5, challengerDishes.length, defenderDishes.length);

    for (let i = 0; i < roundCount; i++) {
      const cDish = challengerDishes[i];
      const dDish = defenderDishes[i];

      const cScore = cDish.rating * 0.6 + Math.min(100, cDish.sales_count) / 100 * 0.4;
      const dScore = dDish.rating * 0.6 + Math.min(100, dDish.sales_count) / 100 * 0.4;

      let winner;
      if (cScore > dScore) {
        winner = 'challenger';
        challengerWins++;
      } else if (dScore > cScore) {
        winner = 'defender';
        defenderWins++;
      } else {
        winner = 'tie';
        ties++;
      }

      rounds.push({
        round: i + 1,
        challenger: {
          dish_name: cDish.name,
          score: cScore,
          sales_count: cDish.sales_count,
          rating: cDish.rating
        },
        defender: {
          dish_name: dDish.name,
          score: dScore,
          sales_count: dDish.sales_count,
          rating: dDish.rating
        },
        winner
      });
    }

    const winnerId = challengerWins > defenderWins ? duel.challenger_id
      : defenderWins > challengerWins ? duel.defender_id
      : null;

    if (winnerId) {
      const winner = Restaurant.findById(winnerId);
      const loserId = winnerId === duel.challenger_id ? duel.defender_id : duel.challenger_id;
      const loser = Restaurant.findById(loserId);

      Player.updateReputation(winner.owner_id, 25);
      Player.updateReputation(loser.owner_id, -5);

      Restaurant.update(winnerId, { total_profit: (winner.total_profit || 0) + 1000 });
      Restaurant.update(loserId, { total_profit: (loser.total_profit || 0) - 100 });
    }

    const completedDuel = Duel.complete(duelId, winnerId, rounds);

    return {
      success: true,
      duel: completedDuel,
      challenger_wins: challengerWins,
      defender_wins: defenderWins,
      ties,
      winner_id: winnerId,
      rounds
    };
  },

  getAllianceDuels: (allianceId) => {
    const restaurants = Restaurant.findByAllianceId(allianceId);
    const restaurantIds = restaurants.map(r => r.id);
    const allDuels = Duel.findAll();

    return allDuels.filter(d =>
      restaurantIds.includes(d.challenger_id) || restaurantIds.includes(d.defender_id)
    );
  },

  getAllianceStats: (allianceId) => {
    const data = allianceService.getAllianceMembers(allianceId);
    if (!data) return null;

    let totalCoins = 0;
    let totalReputation = 0;
    let totalRestaurants = 0;
    let avgRating = 0;
    let count = 0;

    for (const m of data.members) {
      if (m.player) {
        totalCoins += m.player.coins;
        totalReputation += m.player.reputation;
      }
      if (m.restaurants) {
        totalRestaurants += m.restaurants.length;
        for (const r of m.restaurants) {
          avgRating += r.avg_rating;
          count++;
        }
      }
    }

    return {
      member_count: data.members.length,
      total_coins: totalCoins,
      total_reputation: totalReputation,
      total_restaurants: totalRestaurants,
      avg_rating: count > 0 ? Math.round(avgRating / count * 10) / 10 : 0
    };
  }
};

module.exports = allianceService;
