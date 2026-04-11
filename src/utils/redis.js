// src/utils/redis.js
const redis = require('redis');

const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('error', err => console.error('Redis Client Error', err));

// 自动连接
(async () => {
    await redisClient.connect();
    console.log('✅ Connected to Redis');
})();

module.exports = redisClient;