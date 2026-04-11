// src/utils/config.js
const CONFIG = {
    KV_TTL: 3600,         // 坐标等数据有效期：1 小时
    SESSION_TTL: 1800,    // 挪车会话有效期：30 分钟 (1800秒)
    RATE_LIMIT_TTL: 60    // 频率限制：60 秒
};

function getUserConfig(userKey, envPrefix) {
    const specificKey = `${envPrefix}_${userKey.toUpperCase()}`;
    if (process.env[specificKey]) return process.env[specificKey];
    if (process.env[envPrefix]) return process.env[envPrefix];
    return null;
}

function getBaseDomain(req) {
    if (process.env.EXTERNAL_URL) {
        return process.env.EXTERNAL_URL.replace(/\/$/, "");
    }
    return `${req.protocol}://${req.get('host')}`;
}

module.exports = { CONFIG, getUserConfig, getBaseDomain };