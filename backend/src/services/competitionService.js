const Competition = require('../models/Competition');
const Restaurant = require('../models/Restaurant');
const Dish = require('../models/Dish');
const Chef = require('../models/Chef');
const Player = require('../models/Player');
const Inventory = require('../models/Inventory');

const decorFactorMap = {
  modern: 1.1,
  classic: 1.0,
  casual: 1.15,
  luxury: 1.2,
  ethnic: 1.05
};

const competitionService = {
  createCompetition: (date) => {
    return Competition.create(date);
  },

  matchParticipants: (competitionId) => {
    const competition = Competition.findById(competitionId);
    if (!competition) return null;

    const participants = competition.participants_json;
    if (participants.length < 2) {
      return { error: '参赛者不足，至少需要2人' };
    }

    const restaurants = participants.map(id => Restaurant.findById(id)).filter(Boolean);
    restaurants.sort((a, b) => Math.abs(a.avg_rating - b.avg_rating));

    const matches = [];
    for (let i = 0; i < restaurants.length - 1; i += 2) {
      matches.push([restaurants[i].id, restaurants[i + 1].id]);
    }
    if (restaurants.length % 2 === 1) {
      matches.push([restaurants[restaurants.length - 1].id, null]);
    }

    return matches;
  },

  registerForCompetition: (competitionId, restaurantId) => {
    const competition = Competition.findById(competitionId);
    const restaurant = Restaurant.findById(restaurantId);

    if (!competition) return { success: false, error: '比赛不存在' };
    if (!restaurant) return { success: false, error: '餐厅不存在' };
    if (competition.status !== 'upcoming') {
      return { success: false, error: '报名已截止' };
    }
    if (competition.participants_json.includes(restaurantId)) {
      return { success: false, error: '已报名该比赛' };
    }

    Competition.addParticipant(competitionId, restaurantId);
    return { success: true, competition: Competition.findById(competitionId) };
  },

  unregisterFromCompetition: (competitionId, restaurantId) => {
    const competition = Competition.findById(competitionId);
    if (!competition) return { success: false, error: '比赛不存在' };
    if (competition.status !== 'upcoming') {
      return { success: false, error: '比赛已开始，无法取消' };
    }

    Competition.removeParticipant(competitionId, restaurantId);
    return { success: true, competition: Competition.findById(competitionId) };
  },

  startCompetition: (competitionId) => {
    const competition = Competition.findById(competitionId);
    if (!competition) return { success: false, error: '比赛不存在' };
    if (competition.participants_json.length < 2) {
      return { success: false, error: '参赛者不足' };
    }

    return Competition.update(competitionId, { status: 'active' });
  },

  calculateRealTimeMetrics: (competitionId) => {
    const competition = Competition.findById(competitionId);
    if (!competition) return [];

    const results = [];
    for (const restaurantId of competition.participants_json) {
      const restaurant = Restaurant.findById(restaurantId);
      if (!restaurant) continue;

      const baseFlow = 100 + restaurant.level * 20;
      const ratingFactor = 0.5 + restaurant.avg_rating * 0.1;

      const dishes = Dish.findByRestaurantId(restaurantId);
      const avgPrice = dishes.length > 0
        ? dishes.reduce((sum, d) => sum + d.base_price, 0) / dishes.length
        : 80;
      const priceFactor = Math.max(0.6, Math.min(1.2, 80 / avgPrice));

      const decorFactor = decorFactorMap[restaurant.decor_style] || 1.0;

      const customerFlow = Math.round(baseFlow * ratingFactor * priceFactor * decorFactor);
      const turnoverRate = Number(Math.min(5.0, customerFlow / (restaurant.level * 8 + 20)).toFixed(2));
      const satisfaction = Number(Math.min(5.0, Math.max(1.0, restaurant.avg_rating + (Math.random() - 0.3))).toFixed(1));
      const score = Math.round(customerFlow * 0.3 + turnoverRate * 30 + satisfaction * 10);

      results.push({
        restaurant_id: restaurant.id,
        name: restaurant.name,
        customer_flow: customerFlow,
        turnover_rate: turnoverRate,
        satisfaction: satisfaction,
        score: score
      });
    }

    return results;
  },

  executeCompetitionRound: (competitionId) => {
    const competition = Competition.findById(competitionId);
    if (!competition || competition.status !== 'active') {
      return null;
    }

    const results = competitionService.calculateRealTimeMetrics(competitionId);
    results.sort((a, b) => b.score - a.score);
    return results;
  },

  completeCompetition: (competitionId) => {
    const competition = Competition.findById(competitionId);
    if (!competition) return { success: false, error: '比赛不存在' };

    const results = competitionService.executeCompetitionRound(competitionId);
    if (!results) return { success: false, error: '比赛未激活' };

    const rewardDistribution = [
      { rank: 1, coins: 5000, reputation: 100, research_points: 50 },
      { rank: 2, coins: 3000, reputation: 60, research_points: 30 },
      { rank: 3, coins: 1500, reputation: 30, research_points: 15 }
    ];

    results.forEach((result, index) => {
      const rank = index + 1;
      const reward = rewardDistribution.find(r => r.rank === rank);
      const restaurant = Restaurant.findById(result.restaurant_id);
      if (restaurant && reward) {
        Player.updateCoins(restaurant.owner_id, reward.coins);
        Player.updateReputation(restaurant.owner_id, reward.reputation);
        Player.updateResearchPoints(restaurant.owner_id, reward.research_points);
        result.rewards = reward;
      }
    });

    Competition.setResults(competitionId, results);
    return { success: true, results };
  },

  getCompetitionDetails: (competitionId) => {
    const competition = Competition.findById(competitionId);
    if (!competition) return null;

    const participantsDetails = competition.participants_json.map(id => {
      const restaurant = Restaurant.findById(id);
      return restaurant ? {
        id: restaurant.id,
        name: restaurant.name,
        cuisine_type: restaurant.cuisine_type,
        level: restaurant.level,
        avg_rating: restaurant.avg_rating,
        total_profit: restaurant.total_profit
      } : null;
    }).filter(Boolean);

    return {
      ...competition,
      participants_details: participantsDetails
    };
  },

  getUpcomingCompetitions: () => {
    return Competition.findByStatus('upcoming');
  },

  getActiveCompetitions: () => {
    return Competition.findByStatus('active');
  },

  getCompletedCompetitions: () => {
    return Competition.findByStatus('completed');
  }
};

module.exports = competitionService;
