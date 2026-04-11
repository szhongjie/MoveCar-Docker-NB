// src/routes/api.js
const express = require('express');
const router = express.Router();
const redisClient = require('../utils/redis');
const { CONFIG, getUserConfig, getBaseDomain } = require('../utils/config');
const { generateMapUrls } = require('../utils/geo');
const Notifier = require('../services/notifier'); // 【新增】引入推送服务

// 1. 发送通知 API
router.post('/notify', async (req, res) => {
    const userKey = (req.query.u || 'default').toLowerCase();
    
    try {
        const lockKey = "movecar:lock:" + userKey;
        const isLocked = await redisClient.get(lockKey);
        if (isLocked) {
            return res.status(429).json({ success: false, error: '发送频率过快，请一分钟后再试' });
        }

        const body = req.body;
        const sessionId = body.sessionId; 
        
        // 获取车主配置与域名
        const config = await getUserConfig(userKey);
        const ppToken = config.pushplusToken;
        const barkUrl = config.barkUrl;
        const carTitle = config.carTitle || '车主';
        
        const domain = await getBaseDomain(req);
        const confirmUrl = `${domain}/owner-confirm?u=${userKey}`;

        // 统一构造推送的标题和内容 (修复了以前的换行符错误)
        const notifyTitle = `🚗 挪车请求：${carTitle}`;
        const notifyContent = `💬 留言内容：${body.message || '车旁有人等待，请速来挪车。'}`;
        
        // Redis 状态存储
        const statusData = { status: 'waiting', sessionId: sessionId };
        if (body.location && body.location.lat) {
            const maps = generateMapUrls(body.location.lat, body.location.lng);
            await redisClient.set("movecar:loc:" + userKey, JSON.stringify({ ...body.location, ...maps }), { EX: CONFIG.KV_TTL });
        }
        await redisClient.set("movecar:status:" + userKey, JSON.stringify(statusData), { EX: CONFIG.SESSION_TTL });
        await redisClient.set(lockKey, '1', { EX: CONFIG.RATE_LIMIT_TTL });

        // 🌟 触发多通道推送 (策略模式调度)
        const tasks = [];
        if (ppToken) tasks.push(Notifier.sendPushPlus(ppToken, notifyTitle, notifyContent, confirmUrl));
        if (barkUrl) tasks.push(Notifier.sendBark(barkUrl, notifyTitle, notifyContent, confirmUrl));

        // 不阻塞直接返回，让通知在后台慢慢发
        Promise.all(tasks); 
        return res.json({ success: true });

    } catch (e) {
        console.error('Notify Error:', e);
        return res.status(500).json({ success: false, error: '服务器内部错误' });
    }
});
// 2. 查询状态 API
router.get('/check-status', async (req, res) => {
    const userKey = (req.query.u || 'default').toLowerCase();
    const clientSessionId = req.query.s;

    const data = await redisClient.get("movecar:status:" + userKey);
    if (!data) return res.json({ status: 'none' });

    const statusObj = JSON.parse(data);
    if (statusObj.sessionId !== clientSessionId) {
        return res.json({ status: 'none' });
    }

    const ownerLoc = await redisClient.get("movecar:owner_loc:" + userKey);
    return res.json({ 
        status: statusObj.status, 
        ownerLocation: ownerLoc ? JSON.parse(ownerLoc) : null 
    });
});

// 3. 车主获取位置 API
router.get('/get-location', async (req, res) => {
    const userKey = (req.query.u || 'default').toLowerCase();
    const data = await redisClient.get("movecar:loc:" + userKey);
    res.setHeader('Content-Type', 'application/json');
    res.send(data || '{}');
});

// 4. 车主确认处理 API
router.post('/owner-confirm', async (req, res) => {
    const userKey = (req.query.u || 'default').toLowerCase();
    const body = req.body;
    
    const data = await redisClient.get("movecar:status:" + userKey);
    if (data) {
        const statusObj = JSON.parse(data);
        statusObj.status = 'confirmed'; 
        
        if (body.location) {
            const urls = generateMapUrls(body.location.lat, body.location.lng);
            await redisClient.set("movecar:owner_loc:" + userKey, JSON.stringify({ ...body.location, ...urls }), { EX: 600 });
        }
        
        await redisClient.set("movecar:status:" + userKey, JSON.stringify(statusObj), { EX: 600 });
    }
    return res.json({ success: true });
});

module.exports = router;