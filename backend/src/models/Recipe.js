const database = require('../config/database');

const getDb = () => database.db;

const Recipe = {
  create: (name, cuisineType, ingredientsJson, difficulty, rarity, costPoints, isUnlockable = true) => {
    const db = getDb();
    const result = db.prepare('INSERT INTO recipes (name, cuisine_type, ingredients_json, difficulty, rarity, is_unlockable, cost_points) VALUES (?, ?, ?, ?, ?, ?, ?)').run(name, cuisineType, JSON.stringify(ingredientsJson), difficulty, rarity, isUnlockable ? 1 : 0, costPoints);
    return Recipe.findById(result.lastInsertRowid);
  },

  findById: (id) => {
    const db = getDb();
    const recipe = db.prepare('SELECT * FROM recipes WHERE id = ?').get(id);
    if (recipe) {
      recipe.ingredients_json = JSON.parse(recipe.ingredients_json);
      recipe.is_unlockable = !!recipe.is_unlockable;
    }
    return recipe;
  },

  findByName: (name) => {
    const db = getDb();
    const recipe = db.prepare('SELECT * FROM recipes WHERE name = ?').get(name);
    if (recipe) {
      recipe.ingredients_json = JSON.parse(recipe.ingredients_json);
      recipe.is_unlockable = !!recipe.is_unlockable;
    }
    return recipe;
  },

  findAll: () => {
    const db = getDb();
    const recipes = db.prepare('SELECT * FROM recipes ORDER BY cuisine_type, difficulty').all();
    return recipes.map(recipe => ({
      ...recipe,
      ingredients_json: JSON.parse(recipe.ingredients_json),
      is_unlockable: !!recipe.is_unlockable
    }));
  },

  findByCuisineType: (cuisineType) => {
    const db = getDb();
    const recipes = db.prepare('SELECT * FROM recipes WHERE cuisine_type = ? ORDER BY difficulty').all(cuisineType);
    return recipes.map(recipe => ({
      ...recipe,
      ingredients_json: JSON.parse(recipe.ingredients_json),
      is_unlockable: !!recipe.is_unlockable
    }));
  },

  findByDifficulty: (maxDifficulty) => {
    const db = getDb();
    const recipes = db.prepare('SELECT * FROM recipes WHERE difficulty <= ? ORDER BY difficulty').all(maxDifficulty);
    return recipes.map(recipe => ({
      ...recipe,
      ingredients_json: JSON.parse(recipe.ingredients_json),
      is_unlockable: !!recipe.is_unlockable
    }));
  },

  update: (id, data) => {
    const db = getDb();
    const fields = [];
    const values = [];
    if (data.name !== undefined) { fields.push('name = ?'); values.push(data.name); }
    if (data.cuisine_type !== undefined) { fields.push('cuisine_type = ?'); values.push(data.cuisine_type); }
    if (data.ingredients_json !== undefined) { fields.push('ingredients_json = ?'); values.push(JSON.stringify(data.ingredients_json)); }
    if (data.difficulty !== undefined) { fields.push('difficulty = ?'); values.push(data.difficulty); }
    if (data.rarity !== undefined) { fields.push('rarity = ?'); values.push(data.rarity); }
    if (data.is_unlockable !== undefined) { fields.push('is_unlockable = ?'); values.push(data.is_unlockable ? 1 : 0); }
    if (data.cost_points !== undefined) { fields.push('cost_points = ?'); values.push(data.cost_points); }
    if (fields.length > 0) {
      values.push(id);
      db.prepare(`UPDATE recipes SET ${fields.join(', ')} WHERE id = ?`).run(...values);
    }
    return Recipe.findById(id);
  }
};

module.exports = Recipe;
