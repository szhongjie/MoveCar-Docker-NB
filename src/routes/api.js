// src/routes/api.js
const express = require('express');
const router = express.Router();
const redisClient = require('../utils/redis');
const { CONFIG, getUserConfig, getBaseDomain, getSystemSettings } = require('../utils/config');
const { generateMapUrls } = require('../utils/geo');
const Notifier = require('../services/notifier');

router.post('/notify', async (req, res) => {
    const userKey = (req.query.u || 'default').toLowerCase();
    try {
        const lockKey = "movecar:lock:" + userKey;
        if (await redisClient.get(lockKey)) return res.status(429).json({ success: false, error: '发送频率过快' });

        const body = req.body;
        const config = await getUserConfig(userKey);
        const sys = await getSystemSettings(); // 获取全局配置 (TG Bot, WxPusher AppToken, SMTP等)
        
        const carTitle = config.carTitle || '车主';
        const domain = await getBaseDomain();
        const safeDomain = domain || `${req.protocol}://${req.get('host')}`;
        const confirmUrl = `${safeDomain}/owner-confirm?u=${userKey}`;

        const notifyTitle = `🚗 挪车请求：${carTitle}`;
        const notifyContent = `💬 留言内容：${body.message || '车旁有人等待，请速来挪车。'}`;
        
        // Redis 状态存储
        if (body.location && body.location.lat) {
            const maps = generateMapUrls(body.location.lat, body.location.lng);
            await redisClient.set("movecar:loc:" + userKey, JSON.stringify({ ...body.location, ...maps }), { EX: CONFIG.KV_TTL });
        }
        await redisClient.set("movecar:status:" + userKey, JSON.stringify({ status: 'waiting', sessionId: body.sessionId }), { EX: CONFIG.SESSION_TTL });
        await redisClient.set(lockKey, '1', { EX: CONFIG.RATE_LIMIT_TTL });

        // 🌟 并发触发所有配置了的通道
        const tasks = [];
        if (config.pushplusToken) tasks.push(Notifier.sendPushPlus(config.pushplusToken, notifyTitle, notifyContent, confirmUrl));
        if (config.barkUrl) tasks.push(Notifier.sendBark(config.barkUrl, notifyTitle, notifyContent, confirmUrl));
        if (sys.wxpusherAppToken && config.wxpusherUid) tasks.push(Notifier.sendWxPusher(sys.wxpusherAppToken, config.wxpusherUid, notifyTitle, notifyContent, confirmUrl));
        if (config.serverChanKey) tasks.push(Notifier.sendServerChan(config.serverChanKey, notifyTitle, notifyContent, confirmUrl));
        if (sys.tgBotToken && config.tgChatId) tasks.push(Notifier.sendTelegram(sys.tgBotToken, config.tgChatId, notifyTitle, notifyContent, confirmUrl));
        if (config.wecomUrl) tasks.push(Notifier.sendWeCom(config.wecomUrl, notifyTitle, notifyContent, confirmUrl));
        if (config.dingtalkUrl) tasks.push(Notifier.sendDingTalk(config.dingtalkUrl, notifyTitle, notifyContent, confirmUrl));
        if (config.webhookUrl) tasks.push(Notifier.sendWebhook(config.webhookUrl, notifyTitle, notifyContent, confirmUrl));
        if (sys.smtpHost && config.email) tasks.push(Notifier.sendEmail(sys, config.email, notifyTitle, notifyContent, confirmUrl));

        Promise.all(tasks); 
        return res.json({ success: true });
    } catch (e) {
        console.error('Notify Error:', e);
        return res.status(500).json({ success: false, error: '系统内部错误' });
    }
});

router.get('/check-status', async (req, res) => {
    const userKey = (req.query.u || 'default').toLowerCase();
    const clientSessionId = req.query.s;

    const data = await redisClient.get("movecar:status:" + userKey);
    if (!data) return res.json({ status: 'none' });

    const statusObj = JSON.parse(data);
    if (statusObj.sessionId !== clientSessionId) return res.json({ status: 'none' });

    const ownerLoc = await redisClient.get("movecar:owner_loc:" + userKey);
    return res.json({ status: statusObj.status, ownerLocation: ownerLoc ? JSON.parse(ownerLoc) : null });
});

router.get('/get-location', async (req, res) => {
    const userKey = (req.query.u || 'default').toLowerCase();
    const data = await redisClient.get("movecar:loc:" + userKey);
    res.setHeader('Content-Type', 'application/json');
    res.send(data || '{}');
});

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