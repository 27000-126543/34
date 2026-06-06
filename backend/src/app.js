const express = require('express');
const cors = require('cors');
const { initDatabase } = require('./config/database');

const authRoutes = require('./routes/auth');
const restaurantRoutes = require('./routes/restaurant');
const chefRoutes = require('./routes/chef');
const dishRoutes = require('./routes/dish');
const { router: marketRoutes, setIo: setMarketIo } = require('./routes/market');
const { router: competitionRoutes, setIo: setCompetitionIo } = require('./routes/competition');
const { router: allianceRoutes, setIo: setAllianceIo } = require('./routes/alliance');
const reportRoutes = require('./routes/report');
const leaderboardRoutes = require('./routes/leaderboard');

const createApp = async (io) => {
  const app = express();

  await initDatabase();

  app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  }));

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  setMarketIo(io);
  setCompetitionIo(io);
  setAllianceIo(io);

  app.get('/health', (req, res) => {
    res.json({
      status: 'ok',
      message: 'Global Cuisine Tycoon API is running',
      timestamp: new Date().toISOString()
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/restaurants', restaurantRoutes);
  app.use('/api/chefs', chefRoutes);
  app.use('/api/dishes', dishRoutes);
  app.use('/api/market', marketRoutes);
  app.use('/api/competitions', competitionRoutes);
  app.use('/api/alliances', allianceRoutes);
  app.use('/api/reports', reportRoutes);
  app.use('/api/leaderboards', leaderboardRoutes);

  app.use((req, res) => {
    res.status(404).json({ error: 'API 路由不存在' });
  });

  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: '服务器内部错误' });
  });

  return app;
};

module.exports = createApp;
