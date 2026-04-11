// src/utils/config.js
const redisClient = require('./redis');

const CONFIG = {
    KV_TTL: 3600,         
    SESSION_TTL: 1800,    
    RATE_LIMIT_TTL: 60    
};

// 异步读取车主配置
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
    // 数据库没有时，给个空兜底
    return { carTitle: '未知车主', pushplusToken: '', barkUrl: '', phone: '' };
}

// 异步读取绑定的外部域名
async function getBaseDomain(req) {
    try {
        const domain = await redisClient.get('movecar:settings:domain');
        if (domain) return domain.replace(/\/$/, ""); // 去掉末尾斜杠
    } catch (e) {
        console.error("Redis domain read error:", e);
    }
    // 如果后台还没设置域名，自动降级为当前访问地址
    return `${req.protocol}://${req.get('host')}`;
}

module.exports = { CONFIG, getUserConfig, getBaseDomain };