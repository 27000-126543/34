const Ingredient = require('../models/Ingredient');
const Inventory = require('../models/Inventory');
const MarketTransaction = require('../models/MarketTransaction');
const Restaurant = require('../models/Restaurant');
const Player = require('../models/Player');

const SEASONAL_EVENTS = [
  { name: '春节大采购', season: 'spring', multipliers: { meat: 1.3, vegetable: 1.2, seafood: 1.4 } },
  { name: '夏季海鲜季', season: 'summer', multipliers: { seafood: 0.85, vegetable: 1.1 } },
  { name: '秋季丰收节', season: 'autumn', multipliers: { vegetable: 0.8, grain: 0.85, spice: 1.1 } },
  { name: '冬季火锅季', season: 'winter', multipliers: { meat: 1.25, spice: 1.3, dairy: 1.15 } }
];

const marketService = {
  calculateDynamicPrice: (ingredientId) => {
    const ingredient = Ingredient.findById(ingredientId);
    if (!ingredient) return null;

    const volume = MarketTransaction.getTransactionVolume(ingredientId, 24);
    let demandMultiplier = 1;
    if (volume.total_quantity > 100) {
      demandMultiplier = 1.15;
    } else if (volume.total_quantity > 50) {
      demandMultiplier = 1.05;
    } else if (volume.total_quantity < 10) {
      demandMultiplier = 0.9;
    }

    const basePrice = ingredient.base_price;
    const seasonMultiplier = ingredient.season_affect || 1;
    const randomVariation = 0.95 + Math.random() * 0.1;

    const newPrice = basePrice * demandMultiplier * seasonMultiplier * randomVariation;
    return Math.round(Math.max(basePrice * 0.5, Math.min(basePrice * 2, newPrice)) * 100) / 100;
  },

  updateMarketPrices: () => {
    const ingredients = Ingredient.findAll();
    const updated = [];
    for (const ing of ingredients) {
      const newPrice = marketService.calculateDynamicPrice(ing.id);
      if (newPrice !== null) {
        Ingredient.updatePrice(ing.id, newPrice);
        updated.push({ id: ing.id, name: ing.name, old_price: ing.current_price, new_price: newPrice });
      }
    }
    return updated;
  },

  triggerSeasonalEvent: () => {
    const event = SEASONAL_EVENTS[Math.floor(Math.random() * SEASONAL_EVENTS.length)];
    const ingredients = Ingredient.findAll();
    const affected = [];

    for (const ing of ingredients) {
      if (event.multipliers[ing.category]) {
        const multiplier = event.multipliers[ing.category];
        const newPrice = Math.round(ing.base_price * multiplier * 100) / 100;
        Ingredient.updatePrice(ing.id, newPrice);
        affected.push({ id: ing.id, name: ing.name, category: ing.category, multiplier, new_price: newPrice });
      }
    }

    return { event, affected };
  },

  buyIngredient: (buyerRestaurantId, ingredientId, quantity) => {
    const buyer = Restaurant.findById(buyerRestaurantId);
    const ingredient = Ingredient.findById(ingredientId);

    if (!buyer) return { success: false, error: '餐厅不存在' };
    if (!ingredient) return { success: false, error: '食材不存在' };

    const totalCost = ingredient.current_price * quantity;
    const owner = Player.findById(buyer.owner_id);

    if (!owner || owner.coins < totalCost) {
      return { success: false, error: '金币不足，需要 ' + totalCost + ' 金币' };
    }

    if (quantity <= 0 || quantity > 500) {
      return { success: false, error: '购买数量必须在1-500之间' };
    }

    Player.updateCoins(buyer.owner_id, -totalCost);
    Inventory.create(buyerRestaurantId, ingredientId, quantity, 100);

    const transaction = MarketTransaction.create(
      buyerRestaurantId,
      0,
      ingredientId,
      quantity,
      ingredient.current_price
    );

    return {
      success: true,
      transaction,
      total_cost: totalCost,
      remaining_coins: owner.coins - totalCost
    };
  },

  sellIngredient: (sellerRestaurantId, ingredientId, quantity) => {
    const seller = Restaurant.findById(sellerRestaurantId);
    const ingredient = Ingredient.findById(ingredientId);
    const inventory = Inventory.findByRestaurantAndIngredient(sellerRestaurantId, ingredientId);

    if (!seller) return { success: false, error: '餐厅不存在' };
    if (!ingredient) return { success: false, error: '食材不存在' };
    if (!inventory || inventory.quantity < quantity) {
      return { success: false, error: '库存不足' };
    }

    if (quantity <= 0) {
      return { success: false, error: '出售数量必须大于0' };
    }

    const freshnessPenalty = inventory.freshness / 100;
    const sellPrice = Math.round(ingredient.current_price * 0.8 * freshnessPenalty * 100) / 100;
    const totalRevenue = sellPrice * quantity;

    Inventory.updateQuantity(inventory.id, -quantity);
    Player.updateCoins(seller.owner_id, totalRevenue);

    const transaction = MarketTransaction.create(
      0,
      sellerRestaurantId,
      ingredientId,
      quantity,
      sellPrice
    );

    return {
      success: true,
      transaction,
      total_revenue: totalRevenue,
      sell_price: sellPrice
    };
  },

  tradeBetweenRestaurants: (buyerRestaurantId, sellerRestaurantId, ingredientId, quantity, agreedPrice) => {
    const buyer = Restaurant.findById(buyerRestaurantId);
    const seller = Restaurant.findById(sellerRestaurantId);
    const ingredient = Ingredient.findById(ingredientId);
    const inventory = Inventory.findByRestaurantAndIngredient(sellerRestaurantId, ingredientId);

    if (!buyer || !seller) return { success: false, error: '餐厅不存在' };
    if (!ingredient) return { success: false, error: '食材不存在' };
    if (!inventory || inventory.quantity < quantity) {
      return { success: false, error: '卖家库存不足' };
    }

    const totalCost = agreedPrice * quantity;
    const buyerOwner = Player.findById(buyer.owner_id);

    if (!buyerOwner || buyerOwner.coins < totalCost) {
      return { success: false, error: '买家金币不足' };
    }

    Player.updateCoins(buyer.owner_id, -totalCost);
    Player.updateCoins(seller.owner_id, totalCost);

    Inventory.updateQuantity(inventory.id, -quantity);
    Inventory.create(buyerRestaurantId, ingredientId, quantity, inventory.freshness);

    const transaction = MarketTransaction.create(
      buyerRestaurantId,
      sellerRestaurantId,
      ingredientId,
      quantity,
      agreedPrice
    );

    return {
      success: true,
      transaction,
      total_cost: totalCost
    };
  },

  getMarketSummary: () => {
    const ingredients = Ingredient.findAll();
    const summary = ingredients.map(ing => {
      const volume = MarketTransaction.getTransactionVolume(ing.id, 24);
      return {
        ...ing,
        transaction_volume: volume.total_quantity,
        avg_price_24h: volume.avg_price,
        price_change: ing.current_price !== ing.base_price
          ? Math.round((ing.current_price - ing.base_price) / ing.base_price * 100)
          : 0
      };
    });
    return summary.sort((a, b) => Math.abs(b.price_change) - Math.abs(a.price_change));
  },

  getRecentTransactions: (limit = 20) => {
    return MarketTransaction.findAll(limit);
  }
};

module.exports = marketService;
