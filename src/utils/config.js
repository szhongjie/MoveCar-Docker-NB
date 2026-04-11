// src/utils/config.js
const redisClient = require('./redis');

const CONFIG = {
    KV_TTL: 3600,         
    SESSION_TTL: 1800,    
    RATE_LIMIT_TTL: 60    
};

async function getUserConfig(userKey) {
    const key = userKey.toLowerCase();
    try {
        const redisData = await redisClient.hGet('movecar:users', key);
        if (redisData) {
            return JSON.parse(redisData);
        }
    } catch (e) {
        console.error("Redis config read error:", e);
    }
    return { carTitle: '未知车主', pushplusToken: '', barkUrl: '', phone: '' };
}

async function getBaseDomain() {
    try {
        const domain = await redisClient.get('movecar:settings:domain');
        if (domain) return domain.replace(/\/$/, ""); 
    } catch (e) {
        console.error("Redis domain read error:", e);
    }
    return ""; // 强制要求后台配置
}

module.exports = { CONFIG, getUserConfig, getBaseDomain };