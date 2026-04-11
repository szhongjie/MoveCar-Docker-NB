// src/utils/config.js
const redisClient = require('./redis'); // 引入 redis 客户端

const CONFIG = {
    KV_TTL: 3600,         
    SESSION_TTL: 1800,    
    RATE_LIMIT_TTL: 60    
};

// 异步获取用户配置：Redis 优先，环境变量兜底
async function getUserConfig(userKey) {
    const key = userKey.toLowerCase();
    
    try {
        // 1. 尝试从 Redis 读取动态配置
        const redisData = await redisClient.hGet('movecar:users', key);
        if (redisData) {
            return JSON.parse(redisData);
        }
    } catch (e) {
        console.error("Redis config read error:", e);
    }

    // 2. 如果 Redis 没有，回退到老版本的环境变量读取逻辑
    const envPrefixes = {
        carTitle: 'CAR_TITLE',
        pushplusToken: 'PUSHPLUS_TOKEN',
        barkUrl: 'BARK_URL',
        phone: 'PHONE_NUMBER'
    };

    const config = {};
    const upperKey = key.toUpperCase();
    
    for (const [prop, envKey] of Object.entries(envPrefixes)) {
        // 优先读带后缀的 (如 CAR_TITLE_USER1)，其次读默认的 (CAR_TITLE)
        config[prop] = process.env[`${envKey}_${upperKey}`] || process.env[envKey] || '';
    }

    // 给个默认称号
    if (!config.carTitle) config.carTitle = '车主';
    
    return config;
}

function getBaseDomain(req) {
    if (process.env.EXTERNAL_URL) {
        return process.env.EXTERNAL_URL.replace(/\/$/, "");
    }
    return `${req.protocol}://${req.get('host')}`;
}

module.exports = { CONFIG, getUserConfig, getBaseDomain };