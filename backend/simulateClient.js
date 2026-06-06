const { io } = require('socket.io-client');

const clientId = process.argv[2] || 'client';
const socket = io('ws://localhost:3001');

const stats = {
  marketUpdate: 0,
  competitionUpdate: 0,
  duelUpdate: 0,
  notification: 0,
  tradesSent: 0,
};

socket.on('connect', () => {
  console.log(`[${clientId}] Connected, socket id: ${socket.id}`);

  socket.emit('join', 'market');

  const tradeInterval = setInterval(() => {
    const tradeData = {
      clientId,
      ingredient_id: Math.floor(Math.random() * 24) + 1,
      quantity: Math.floor(Math.random() * 10) + 1,
      action: Math.random() > 0.5 ? 'buy' : 'sell',
    };
    socket.emit('market:trade', tradeData);
    stats.tradesSent++;
  }, 200);

  socket.on('market:update', () => {
    stats.marketUpdate++;
  });

  socket.on('competition:update', () => {
    stats.competitionUpdate++;
  });

  socket.on('duel:update', () => {
    stats.duelUpdate++;
  });

  socket.on('notification', () => {
    stats.notification++;
  });

  setTimeout(() => {
    clearInterval(tradeInterval);
    console.log(`[${clientId}] Stats:`, JSON.stringify(stats));
    socket.disconnect();
  }, 10000);
});

socket.on('connect_error', (err) => {
  console.error(`[${clientId}] Connect error:`, err.message);
});

socket.on('disconnect', () => {
  console.log(`[${clientId}] Disconnected`);
});
