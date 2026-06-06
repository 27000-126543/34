let Redis;
try {
  Redis = require('ioredis');
} catch (e) {
  Redis = null;
}

const memoryStore = new Map();
const memoryTtl = new Map();

let redisClient = null;
let useRedis = false;

try {
  if (Redis) {
    redisClient = new Redis({
      host: 'localhost',
      port: 6379,
      enableOfflineQueue: false,
      retryStrategy: () => null
    });
    redisClient.on('connect', () => {
      useRedis = true;
    });
    redisClient.on('error', () => {
      useRedis = false;
    });
  }
} catch (e) {
  useRedis = false;
  redisClient = null;
}

const get = async (key) => {
  if (useRedis && redisClient) {
    try {
      const value = await redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      useRedis = false;
    }
  }
  const ttl = memoryTtl.get(key);
  if (ttl && Date.now() > ttl) {
    memoryStore.delete(key);
    memoryTtl.delete(key);
    return null;
  }
  const value = memoryStore.get(key);
  return value !== undefined ? value : null;
};

const set = async (key, value, ttl) => {
  const serialized = JSON.stringify(value);
  if (useRedis && redisClient) {
    try {
      if (ttl) {
        await redisClient.set(key, serialized, 'EX', ttl);
      } else {
        await redisClient.set(key, serialized);
      }
      return;
    } catch (e) {
      useRedis = false;
    }
  }
  memoryStore.set(key, value);
  if (ttl) {
    memoryTtl.set(key, Date.now() + ttl * 1000);
  }
};

const del = async (key) => {
  if (useRedis && redisClient) {
    try {
      await redisClient.del(key);
      return;
    } catch (e) {
      useRedis = false;
    }
  }
  memoryStore.delete(key);
  memoryTtl.delete(key);
};

const getIngredientPrice = async (id) => {
  return get(`ingredient:price:${id}`);
};

const setIngredientPrice = async (id, price, ttl = 30) => {
  return set(`ingredient:price:${id}`, price, ttl);
};

const getPlayerSession = async (token) => {
  return get(`player:session:${token}`);
};

const setPlayerSession = async (token, player, ttl = 86400) => {
  return set(`player:session:${token}`, player, ttl);
};

module.exports = {
  get,
  set,
  del,
  getIngredientPrice,
  setIngredientPrice,
  getPlayerSession,
  setPlayerSession
};
