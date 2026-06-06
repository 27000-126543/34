const http = require('http');
const { Server } = require('socket.io');
const createApp = require('./app');

const PORT = process.env.PORT || 3001;

const startServer = async () => {
  const server = http.createServer();
  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  const app = await createApp(io);

  server.on('request', app);

  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    socket.on('market:subscribe', () => {
      socket.join('market');
    });

    socket.on('competition:subscribe', (competitionId) => {
      socket.join(`competition:${competitionId}`);
    });

    socket.on('duel:subscribe', (duelId) => {
      socket.join(`duel:${duelId}`);
    });

    socket.on('restaurant:subscribe', (restaurantId) => {
      socket.join(`restaurant:${restaurantId}`);
    });

    socket.on('alliance:subscribe', (allianceId) => {
      socket.join(`alliance:${allianceId}`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });

  server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║   Global Cuisine Tycoon Backend Server                   ║
╠══════════════════════════════════════════════════════════╣
║   HTTP Server:   http://localhost:${PORT}                   ║
║   Socket.IO:     ws://localhost:${PORT}                     ║
║   Health Check:  http://localhost:${PORT}/health            ║
╚══════════════════════════════════════════════════════════╝
    `);
  });

  return { io, server };
};

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});

module.exports = { startServer };
