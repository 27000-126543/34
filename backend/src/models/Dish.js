const database = require('../config/database');

const getDb = () => database.db;

const Dish = {
  create: (restaurantId, name, cuisineType, ingredientsJson, basePrice, isRare = false) => {
    const db = getDb();
    const result = db.prepare('INSERT INTO dishes (restaurant_id, name, cuisine_type, ingredients_json, base_price, is_rare) VALUES (?, ?, ?, ?, ?, ?)').run(restaurantId, name, cuisineType, JSON.stringify(ingredientsJson), basePrice, isRare ? 1 : 0);
    return Dish.findById(result.lastInsertRowid);
  },

  findById: (id) => {
    const db = getDb();
    const dish = db.prepare('SELECT * FROM dishes WHERE id = ?').get(id);
    if (dish) {
      dish.ingredients_json = JSON.parse(dish.ingredients_json);
      dish.is_rare = !!dish.is_rare;
    }
    return dish;
  },

  findByRestaurantId: (restaurantId) => {
    const db = getDb();
    const dishes = db.prepare('SELECT * FROM dishes WHERE restaurant_id = ?').all(restaurantId);
    return dishes.map(dish => ({
      ...dish,
      ingredients_json: JSON.parse(dish.ingredients_json),
      is_rare: !!dish.is_rare
    }));
  },

  update: (id, data) => {
    const db = getDb();
    const fields = [];
    const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.cuisine_type !== undefined) { fields.push('cuisine_type = ?'); values.push(data.cuisine_type); }
    if (data.ingredients_json !== undefined) { fields.push('ingredients_json = ?'); values.push(JSON.stringify(data.ingredients_json)); }
    if (data.base_price !== undefined) { fields.push('base_price = ?'); values.push(data.base_price); }
    if (data.rating !== undefined) { fields.push('rating = ?'); values.push(data.rating); }
    if (data.sales_count !== undefined) { fields.push('sales_count = ?'); values.push(data.sales_count); }
    if (data.is_rare !== undefined) { fields.push('is_rare = ?'); values.push(data.is_rare ? 1 : 0); }
    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE dishes SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
    return Dish.findById(id);
  },

  incrementSales: (id, count = 1) => {
    const db = getDb();
    db.prepare('UPDATE dishes SET sales_count = sales_count + ? WHERE id = ?').run(count, id);
    return Dish.findById(id);
  },

  delete: (id) => {
    const db = getDb();
    const result = db.prepare('DELETE FROM dishes WHERE id = ?').run(id);
    return result.changes > 0;
  },

  findAll: () => {
    const db = getDb();
    const dishes = db.prepare('SELECT * FROM dishes ORDER BY sales_count DESC').all();
    return dishes.map(dish => ({
      ...dish,
      ingredients_json: JSON.parse(dish.ingredients_json),
      is_rare: !!dish.is_rare
    }));
  },

  getPopularByRestaurant: (restaurantId, limit = 5) => {
    const db = getDb();
    const dishes = db.prepare('SELECT * FROM dishes WHERE restaurant_id = ? ORDER BY sales_count DESC LIMIT ?').all(restaurantId, limit);
    return dishes.map(dish => ({
      ...dish,
      ingredients_json: JSON.parse(dish.ingredients_json),
      is_rare: !!dish.is_rare
    }));
  }
};

module.exports = Dish;
