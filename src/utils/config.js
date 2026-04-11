// src/utils/config.js
const redisClient = require('./redis');

const CONFIG = {
    KV_TTL: 3600,         
    SESSION_TTL: 1800,    
    RATE_LIMIT_TTL: 60    
};

async function getSystemSettings() {
    try {
        const data = await redisClient.hGetAll('movecar:settings:system');
        return data || {};
    } catch (e) {
        console.error("Redis system settings read error:", e);
        return {};
    }
}

async function getUserConfig(userKey) {
    const key = userKey.toLowerCase();
    try {
        const redisData = await redisClient.hGet('movecar:users', key);
        if (redisData) return JSON.parse(redisData);
    } catch (e) { console.error("Redis config error:", e); }
    return {};
}

async function getBaseDomain() {
    const sys = await getSystemSettings();
    if (sys.domain) return sys.domain.replace(/\/$/, ""); 
    return ""; // 强制要求后台配置
}

module.exports = { CONFIG, getSystemSettings, getUserConfig, getBaseDomain };