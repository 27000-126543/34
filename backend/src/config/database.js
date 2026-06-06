const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');

let db;

const prepare = (sql) => {
  if (!db) {
    throw new Error('Database not initialized');
  }
  return db.prepare(sql);
};

const saveDatabase = () => {
  const data = db.export();
  const buffer = Buffer.from(data);
  const dbPath = path.join(__dirname, '../../data.db');
  fs.writeFileSync(dbPath, buffer);
};

const attachCustomMethods = () => {
  const originalPrepare = db.prepare.bind(db);

  const getLastInsertId = () => {
    const statement = originalPrepare('SELECT last_insert_rowid() as id');
    let id = 0;
    if (statement.step()) {
      const row = statement.getAsObject();
      id = row.id || 0;
    }
    statement.free();
    return id;
  };

  db.prepare = (sql) => {
    const stmt = originalPrepare(sql);
    let finalized = false;
    return {
      run: (...params) => {
        if (finalized) throw new Error('Statement already finalized');
        if (params.length > 0) stmt.bind(params);
        while (stmt.step()) {}
        stmt.reset();
        const lid = getLastInsertId();
        saveDatabase();
        return {
          lastInsertRowid: lid,
          lastID: lid,
          changes: db.getRowsModified ? db.getRowsModified() : 0
        };
      },
      get: (...params) => {
        if (finalized) throw new Error('Statement already finalized');
        if (params.length > 0) stmt.bind(params);
        let result = null;
        if (stmt.step()) {
          result = stmt.getAsObject();
        }
        stmt.reset();
        return result;
      },
      all: (...params) => {
        if (finalized) throw new Error('Statement already finalized');
        if (params.length > 0) stmt.bind(params);
        const results = [];
        while (stmt.step()) {
          results.push(stmt.getAsObject());
        }
        stmt.reset();
        return results;
      },
      finalize: () => {
        if (!finalized) {
          stmt.free();
          finalized = true;
        }
      }
    };
  };
};

const loadDatabase = async () => {
  const SQL = await initSqlJs();
  const dbPath = path.join(__dirname, '../../data.db');

  if (fs.existsSync(dbPath)) {
    try {
      const fileBuffer = fs.readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
    } catch (e) {
      console.warn('Failed to load existing database, creating new one:', e.message);
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  attachCustomMethods();
};

const initDatabase = async () => {
  await loadDatabase();

  db.exec(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      coins INTEGER DEFAULT 10000,
      reputation INTEGER DEFAULT 0,
      research_points INTEGER DEFAULT 100,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS alliances (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      founder_id INTEGER NOT NULL,
      members_json TEXT DEFAULT '[]',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (founder_id) REFERENCES players(id)
    );

    CREATE TABLE IF NOT EXISTS restaurants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      owner_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      cuisine_type TEXT NOT NULL CHECK(cuisine_type IN ('chinese','french','italian','japanese','mexican','indian')),
      decor_style TEXT NOT NULL CHECK(decor_style IN ('modern','classic','casual','luxury','ethnic')),
      level INTEGER DEFAULT 1,
      total_profit REAL DEFAULT 0,
      avg_rating REAL DEFAULT 0,
      alliance_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES players(id),
      FOREIGN KEY (alliance_id) REFERENCES alliances(id)
    );

    CREATE TABLE IF NOT EXISTS chefs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      level TEXT NOT NULL CHECK(level IN ('apprentice','head_chef','master')) DEFAULT 'apprentice',
      skill INTEGER DEFAULT 10,
      exp INTEGER DEFAULT 0,
      pending_promotion INTEGER DEFAULT 0,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    );

    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      cuisine_type TEXT NOT NULL,
      ingredients_json TEXT NOT NULL DEFAULT '[]',
      base_price REAL NOT NULL,
      rating REAL DEFAULT 0,
      sales_count INTEGER DEFAULT 0,
      is_rare INTEGER DEFAULT 0,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id)
    );

    CREATE TABLE IF NOT EXISTS ingredients (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('meat','vegetable','seafood','spice','grain','dairy')),
      rarity INTEGER DEFAULT 1,
      base_price REAL NOT NULL,
      current_price REAL NOT NULL,
      freshness_days INTEGER DEFAULT 7,
      season_affect REAL DEFAULT 1.0
    );

    CREATE TABLE IF NOT EXISTS inventory (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      ingredient_id INTEGER NOT NULL,
      quantity INTEGER DEFAULT 0,
      freshness INTEGER DEFAULT 100,
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    );

    CREATE TABLE IF NOT EXISTS market_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      buyer_id INTEGER NOT NULL,
      seller_id INTEGER NOT NULL,
      ingredient_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (buyer_id) REFERENCES restaurants(id),
      FOREIGN KEY (seller_id) REFERENCES restaurants(id),
      FOREIGN KEY (ingredient_id) REFERENCES ingredients(id)
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      cuisine_type TEXT NOT NULL,
      ingredients_json TEXT NOT NULL DEFAULT '[]',
      difficulty INTEGER DEFAULT 1,
      rarity INTEGER DEFAULT 1,
      is_unlockable INTEGER DEFAULT 1,
      cost_points INTEGER DEFAULT 50
    );

    CREATE TABLE IF NOT EXISTS chef_equipment (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('knife','pan','utensil','decor')),
      bonus_skill INTEGER DEFAULT 5,
      rarity INTEGER DEFAULT 1,
      cost_points INTEGER DEFAULT 100
    );

    CREATE TABLE IF NOT EXISTS competitions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date DATETIME NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('upcoming','active','completed')) DEFAULT 'upcoming',
      participants_json TEXT DEFAULT '[]',
      results_json TEXT DEFAULT '[]'
    );

    CREATE TABLE IF NOT EXISTS duels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      challenger_id INTEGER NOT NULL,
      defender_id INTEGER NOT NULL,
      status TEXT NOT NULL CHECK(status IN ('active','completed')) DEFAULT 'active',
      dish_results_json TEXT DEFAULT '[]',
      winner_id INTEGER,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      end_time DATETIME,
      FOREIGN KEY (challenger_id) REFERENCES restaurants(id),
      FOREIGN KEY (defender_id) REFERENCES restaurants(id),
      FOREIGN KEY (winner_id) REFERENCES restaurants(id)
    );

    CREATE TABLE IF NOT EXISTS daily_reports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      restaurant_id INTEGER NOT NULL,
      date DATE NOT NULL,
      total_revenue REAL DEFAULT 0,
      total_cost REAL DEFAULT 0,
      customer_count INTEGER DEFAULT 0,
      satisfaction_avg REAL DEFAULT 0,
      popular_dishes_json TEXT DEFAULT '[]',
      ingredient_costs_json TEXT DEFAULT '[]',
      satisfaction_trend_json TEXT DEFAULT '[]',
      FOREIGN KEY (restaurant_id) REFERENCES restaurants(id),
      UNIQUE(restaurant_id, date)
    );
  `);
  saveDatabase();

  await seedData();
};

const seedData = async () => {
  const ingredientCount = prepare('SELECT COUNT(*) as count FROM ingredients').get();
  if (!ingredientCount || ingredientCount.count === 0) {
    const ingredients = [
      { name: '牛肉', category: 'meat', rarity: 2, base_price: 50, current_price: 50, freshness_days: 5, season_affect: 1.0 },
      { name: '猪肉', category: 'meat', rarity: 1, base_price: 30, current_price: 30, freshness_days: 5, season_affect: 1.0 },
      { name: '鸡肉', category: 'meat', rarity: 1, base_price: 25, current_price: 25, freshness_days: 4, season_affect: 1.0 },
      { name: '羊肉', category: 'meat', rarity: 2, base_price: 60, current_price: 60, freshness_days: 5, season_affect: 0.9 },
      { name: '鸭肉', category: 'meat', rarity: 2, base_price: 45, current_price: 45, freshness_days: 4, season_affect: 1.1 },
      { name: '白菜', category: 'vegetable', rarity: 1, base_price: 8, current_price: 8, freshness_days: 7, season_affect: 0.8 },
      { name: '番茄', category: 'vegetable', rarity: 1, base_price: 10, current_price: 10, freshness_days: 6, season_affect: 1.2 },
      { name: '胡萝卜', category: 'vegetable', rarity: 1, base_price: 6, current_price: 6, freshness_days: 10, season_affect: 1.0 },
      { name: '青椒', category: 'vegetable', rarity: 1, base_price: 12, current_price: 12, freshness_days: 7, season_affect: 1.1 },
      { name: '蘑菇', category: 'vegetable', rarity: 2, base_price: 25, current_price: 25, freshness_days: 5, season_affect: 0.9 },
      { name: '三文鱼', category: 'seafood', rarity: 3, base_price: 80, current_price: 80, freshness_days: 3, season_affect: 1.0 },
      { name: '虾', category: 'seafood', rarity: 2, base_price: 55, current_price: 55, freshness_days: 2, season_affect: 1.1 },
      { name: '螃蟹', category: 'seafood', rarity: 3, base_price: 100, current_price: 100, freshness_days: 2, season_affect: 0.85 },
      { name: '鱿鱼', category: 'seafood', rarity: 2, base_price: 40, current_price: 40, freshness_days: 3, season_affect: 1.0 },
      { name: '花椒', category: 'spice', rarity: 2, base_price: 35, current_price: 35, freshness_days: 30, season_affect: 1.0 },
      { name: '八角', category: 'spice', rarity: 2, base_price: 30, current_price: 30, freshness_days: 30, season_affect: 1.0 },
      { name: '黑胡椒', category: 'spice', rarity: 1, base_price: 20, current_price: 20, freshness_days: 45, season_affect: 1.0 },
      { name: '香草', category: 'spice', rarity: 2, base_price: 28, current_price: 28, freshness_days: 14, season_affect: 1.2 },
      { name: '大米', category: 'grain', rarity: 1, base_price: 15, current_price: 15, freshness_days: 90, season_affect: 1.0 },
      { name: '面粉', category: 'grain', rarity: 1, base_price: 12, current_price: 12, freshness_days: 60, season_affect: 1.0 },
      { name: '意大利面', category: 'grain', rarity: 2, base_price: 22, current_price: 22, freshness_days: 180, season_affect: 1.0 },
      { name: '牛奶', category: 'dairy', rarity: 1, base_price: 18, current_price: 18, freshness_days: 7, season_affect: 1.0 },
      { name: '黄油', category: 'dairy', rarity: 2, base_price: 35, current_price: 35, freshness_days: 30, season_affect: 1.0 },
      { name: '奶酪', category: 'dairy', rarity: 2, base_price: 45, current_price: 45, freshness_days: 45, season_affect: 0.95 }
    ];

    for (const item of ingredients) {
      prepare('INSERT INTO ingredients (name, category, rarity, base_price, current_price, freshness_days, season_affect) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(item.name, item.category, item.rarity, item.base_price, item.current_price, item.freshness_days, item.season_affect);
    }
  }

  const recipeCount = prepare('SELECT COUNT(*) as count FROM recipes').get();
  if (!recipeCount || recipeCount.count === 0) {
    const recipes = [
      { name: '宫保鸡丁', cuisine_type: 'chinese', ingredients_json: JSON.stringify([{ ingredient_id: 3, quantity: 200 }, { ingredient_id: 9, quantity: 50 }, { ingredient_id: 15, quantity: 10 }]), difficulty: 2, rarity: 1, is_unlockable: 1, cost_points: 30 },
      { name: '红烧肉', cuisine_type: 'chinese', ingredients_json: JSON.stringify([{ ingredient_id: 2, quantity: 300 }, { ingredient_id: 16, quantity: 5 }]), difficulty: 3, rarity: 2, is_unlockable: 1, cost_points: 60 },
      { name: '麻婆豆腐', cuisine_type: 'chinese', ingredients_json: JSON.stringify([{ ingredient_id: 2, quantity: 100 }, { ingredient_id: 15, quantity: 15 }, { ingredient_id: 20, quantity: 10 }]), difficulty: 2, rarity: 1, is_unlockable: 1, cost_points: 40 },
      { name: '法式洋葱汤', cuisine_type: 'french', ingredients_json: JSON.stringify([{ ingredient_id: 7, quantity: 200 }, { ingredient_id: 23, quantity: 20 }, { ingredient_id: 24, quantity: 30 }]), difficulty: 3, rarity: 2, is_unlockable: 1, cost_points: 70 },
      { name: '鹅肝酱', cuisine_type: 'french', ingredients_json: JSON.stringify([{ ingredient_id: 5, quantity: 150 }, { ingredient_id: 23, quantity: 30 }]), difficulty: 4, rarity: 3, is_unlockable: 1, cost_points: 150 },
      { name: '意大利肉酱面', cuisine_type: 'italian', ingredients_json: JSON.stringify([{ ingredient_id: 1, quantity: 200 }, { ingredient_id: 21, quantity: 200 }, { ingredient_id: 7, quantity: 100 }, { ingredient_id: 18, quantity: 10 }]), difficulty: 2, rarity: 1, is_unlockable: 1, cost_points: 50 },
      { name: '玛格丽特披萨', cuisine_type: 'italian', ingredients_json: JSON.stringify([{ ingredient_id: 22, quantity: 200 }, { ingredient_id: 24, quantity: 100 }, { ingredient_id: 7, quantity: 80 }, { ingredient_id: 18, quantity: 5 }]), difficulty: 2, rarity: 1, is_unlockable: 1, cost_points: 45 },
      { name: '寿司拼盘', cuisine_type: 'japanese', ingredients_json: JSON.stringify([{ ingredient_id: 11, quantity: 150 }, { ingredient_id: 12, quantity: 100 }, { ingredient_id: 20, quantity: 200 }]), difficulty: 4, rarity: 3, is_unlockable: 1, cost_points: 120 },
      { name: '拉面', cuisine_type: 'japanese', ingredients_json: JSON.stringify([{ ingredient_id: 3, quantity: 150 }, { ingredient_id: 21, quantity: 200 }, { ingredient_id: 6, quantity: 50 }]), difficulty: 3, rarity: 2, is_unlockable: 1, cost_points: 80 },
      { name: '墨西哥塔可', cuisine_type: 'mexican', ingredients_json: JSON.stringify([{ ingredient_id: 3, quantity: 200 }, { ingredient_id: 9, quantity: 80 }, { ingredient_id: 7, quantity: 60 }, { ingredient_id: 22, quantity: 100 }]), difficulty: 2, rarity: 1, is_unlockable: 1, cost_points: 40 },
      { name: '印度咖喱鸡', cuisine_type: 'indian', ingredients_json: JSON.stringify([{ ingredient_id: 3, quantity: 250 }, { ingredient_id: 15, quantity: 15 }, { ingredient_id: 16, quantity: 10 }, { ingredient_id: 20, quantity: 150 }]), difficulty: 3, rarity: 2, is_unlockable: 1, cost_points: 70 },
      { name: '清蒸鲈鱼', cuisine_type: 'chinese', ingredients_json: JSON.stringify([{ ingredient_id: 14, quantity: 300 }, { ingredient_id: 18, quantity: 10 }]), difficulty: 3, rarity: 2, is_unlockable: 1, cost_points: 80 }
    ];

    for (const item of recipes) {
      prepare('INSERT INTO recipes (name, cuisine_type, ingredients_json, difficulty, rarity, is_unlockable, cost_points) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(item.name, item.cuisine_type, item.ingredients_json, item.difficulty, item.rarity, item.is_unlockable, item.cost_points);
    }
  }

  const equipmentCount = prepare('SELECT COUNT(*) as count FROM chef_equipment').get();
  if (!equipmentCount || equipmentCount.count === 0) {
    const equipments = [
      { name: '主厨刀', type: 'knife', bonus_skill: 8, rarity: 2, cost_points: 80 },
      { name: '寿司刀', type: 'knife', bonus_skill: 12, rarity: 3, cost_points: 150 },
      { name: '法式煎锅', type: 'pan', bonus_skill: 10, rarity: 2, cost_points: 100 },
      { name: '中式炒锅', type: 'pan', bonus_skill: 10, rarity: 2, cost_points: 100 },
      { name: '精密量勺套装', type: 'utensil', bonus_skill: 5, rarity: 1, cost_points: 40 },
      { name: '专业温度计', type: 'utensil', bonus_skill: 7, rarity: 2, cost_points: 70 },
      { name: '古典水晶吊灯', type: 'decor', bonus_skill: 5, rarity: 2, cost_points: 120 },
      { name: '现代艺术画作', type: 'decor', bonus_skill: 6, rarity: 2, cost_points: 100 },
      { name: '古董银质餐具', type: 'decor', bonus_skill: 10, rarity: 3, cost_points: 200 },
      { name: '大师级雕刻刀', type: 'knife', bonus_skill: 18, rarity: 4, cost_points: 300 }
    ];

    for (const item of equipments) {
      prepare('INSERT INTO chef_equipment (name, type, bonus_skill, rarity, cost_points) VALUES (?, ?, ?, ?, ?)')
        .run(item.name, item.type, item.bonus_skill, item.rarity, item.cost_points);
    }
  }

  const playerCount = prepare('SELECT COUNT(*) as count FROM players').get();
  if (!playerCount || playerCount.count === 0) {
    const hashedPassword = bcrypt.hashSync('123456', 10);
    const players = [
      { username: '美食大师', email: 'master@test.com', password: hashedPassword, coins: 50000, reputation: 850, research_points: 500 },
      { username: '厨艺新星', email: 'star@test.com', password: hashedPassword, coins: 25000, reputation: 320, research_points: 200 },
      { username: '料理探索者', email: 'explorer@test.com', password: hashedPassword, coins: 18000, reputation: 180, research_points: 150 }
    ];

    for (const item of players) {
      prepare('INSERT INTO players (username, email, password, coins, reputation, research_points) VALUES (?, ?, ?, ?, ?, ?)')
        .run(item.username, item.email, item.password, item.coins, item.reputation, item.research_points);
    }

    const restaurants = [
      { owner_id: 1, name: '紫禁阁', cuisine_type: 'chinese', decor_style: 'luxury', level: 5, total_profit: 285000, avg_rating: 4.7 },
      { owner_id: 2, name: '星光小馆', cuisine_type: 'french', decor_style: 'modern', level: 3, total_profit: 78000, avg_rating: 4.2 },
      { owner_id: 3, name: '风味食堂', cuisine_type: 'japanese', decor_style: 'casual', level: 2, total_profit: 32000, avg_rating: 3.9 }
    ];

    for (const item of restaurants) {
      prepare('INSERT INTO restaurants (owner_id, name, cuisine_type, decor_style, level, total_profit, avg_rating) VALUES (?, ?, ?, ?, ?, ?, ?)')
        .run(item.owner_id, item.name, item.cuisine_type, item.decor_style, item.level, item.total_profit, item.avg_rating);
    }

    const chefs = [
      { restaurant_id: 1, name: '王大厨', level: 'master', skill: 92, exp: 15000, pending_promotion: 0 },
      { restaurant_id: 1, name: '李师傅', level: 'head_chef', skill: 75, exp: 6000, pending_promotion: 1 },
      { restaurant_id: 2, name: 'Pierre', level: 'head_chef', skill: 80, exp: 8000, pending_promotion: 0 },
      { restaurant_id: 2, name: 'Marie', level: 'apprentice', skill: 35, exp: 800, pending_promotion: 0 },
      { restaurant_id: 3, name: '田中先生', level: 'head_chef', skill: 72, exp: 5500, pending_promotion: 1 }
    ];

    for (const item of chefs) {
      prepare('INSERT INTO chefs (restaurant_id, name, level, skill, exp, pending_promotion) VALUES (?, ?, ?, ?, ?, ?)')
        .run(item.restaurant_id, item.name, item.level, item.skill, item.exp, item.pending_promotion);
    }

    const dishes = [
      { restaurant_id: 1, name: '招牌红烧肉', cuisine_type: 'chinese', ingredients_json: JSON.stringify([{ ingredient_id: 2, quantity: 300 }]), base_price: 88, rating: 4.8, sales_count: 1250, is_rare: 1 },
      { restaurant_id: 1, name: '宫保鸡丁', cuisine_type: 'chinese', ingredients_json: JSON.stringify([{ ingredient_id: 3, quantity: 200 }]), base_price: 48, rating: 4.5, sales_count: 2100, is_rare: 0 },
      { restaurant_id: 2, name: '经典法式洋葱汤', cuisine_type: 'french', ingredients_json: JSON.stringify([{ ingredient_id: 7, quantity: 200 }]), base_price: 68, rating: 4.3, sales_count: 580, is_rare: 0 },
      { restaurant_id: 3, name: '特制寿司拼盘', cuisine_type: 'japanese', ingredients_json: JSON.stringify([{ ingredient_id: 11, quantity: 150 }]), base_price: 128, rating: 4.4, sales_count: 320, is_rare: 1 }
    ];

    for (const item of dishes) {
      prepare('INSERT INTO dishes (restaurant_id, name, cuisine_type, ingredients_json, base_price, rating, sales_count, is_rare) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
        .run(item.restaurant_id, item.name, item.cuisine_type, item.ingredients_json, item.base_price, item.rating, item.sales_count, item.is_rare);
    }

    const inventories = [
      { restaurant_id: 1, ingredient_id: 1, quantity: 50, freshness: 90 },
      { restaurant_id: 1, ingredient_id: 2, quantity: 80, freshness: 85 },
      { restaurant_id: 1, ingredient_id: 3, quantity: 100, freshness: 95 },
      { restaurant_id: 1, ingredient_id: 7, quantity: 60, freshness: 88 },
      { restaurant_id: 1, ingredient_id: 20, quantity: 200, freshness: 100 },
      { restaurant_id: 2, ingredient_id: 7, quantity: 40, freshness: 92 },
      { restaurant_id: 2, ingredient_id: 23, quantity: 30, freshness: 85 },
      { restaurant_id: 2, ingredient_id: 24, quantity: 50, freshness: 90 },
      { restaurant_id: 3, ingredient_id: 11, quantity: 25, freshness: 95 },
      { restaurant_id: 3, ingredient_id: 12, quantity: 40, freshness: 90 },
      { restaurant_id: 3, ingredient_id: 20, quantity: 150, freshness: 100 }
    ];

    for (const item of inventories) {
      prepare('INSERT INTO inventory (restaurant_id, ingredient_id, quantity, freshness) VALUES (?, ?, ?, ?)')
        .run(item.restaurant_id, item.ingredient_id, item.quantity, item.freshness);
    }
  }
};

module.exports = {
  get db() { return db; },
  initDatabase,
  prepare,
  saveDatabase
};
