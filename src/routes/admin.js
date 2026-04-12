// src/routes/admin.js
const express = require('express');
const router = express.Router();
const redisClient = require('../utils/redis');
const { getSystemSettings } = require('../utils/config');

const adminAuth = (req, res, next) => {
    const pwd = process.env.ADMIN_PASSWORD || '123456';
    const token = req.headers['authorization'] || req.query.token;
    if (token === pwd) next();
    else res.status(401).json({ success: false, error: 'Unauthorized: 密码错误' });
};

router.get('/', async (req, res) => {
    const sys = await getSystemSettings();
    res.render('admin', { sys });
});

router.post('/api/settings/system', adminAuth, async (req, res) => {
    try {
        const payload = req.body;
        if (payload.domain && !payload.domain.startsWith('https://')) return res.json({ success: false, error: '域名必须以 https:// 开头' });
        
        for (const [key, value] of Object.entries(payload)) {
            if(value) await redisClient.hSet('movecar:settings:system', key, value.trim());
            else await redisClient.hDel('movecar:settings:system', key); 
        }
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

// 🌟 新增：保存海报模板 JSON 数组 (带基础校验)
router.post('/api/settings/templates', adminAuth, async (req, res) => {
    try {
        const { templates } = req.body;
        if (!Array.isArray(templates)) return res.json({ success: false, error: '模板数据必须是 JSON 数组' });
        if (templates.length === 0) return res.json({ success: false, error: '模板数据不能为空' });
        
        // 存入 Redis，前端即刻生效
        await redisClient.set('movecar:settings:templates', JSON.stringify(templates));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/api/users', adminAuth, async (req, res) => {
    try {
        const usersData = await redisClient.hGetAll('movecar:users');
        const users = Object.keys(usersData).map(key => ({ userKey: key, ...JSON.parse(usersData[key]) }));
        res.json({ success: true, data: users });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/api/users', adminAuth, async (req, res) => {
    try {
        const body = req.body;
        if (!body.userKey) return res.json({ success: false, error: '必须填写标识码' });
        await redisClient.hSet('movecar:users', body.userKey.toLowerCase(), JSON.stringify(body));
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.delete('/api/users/:key', adminAuth, async (req, res) => {
    try {
        await redisClient.hDel('movecar:users', req.params.key.toLowerCase());
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

module.exports = router;