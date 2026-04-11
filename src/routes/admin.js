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

// 保存全局系统配置 (域名、SMTP、公共Token等)
router.post('/api/settings/system', adminAuth, async (req, res) => {
    try {
        const payload = req.body;
        // 如果域名没填 https，强制报错
        if (payload.domain && !payload.domain.startsWith('https://')) return res.json({ success: false, error: '域名必须以 https:// 开头' });
        
        for (const [key, value] of Object.entries(payload)) {
            if(value) await redisClient.hSet('movecar:settings:system', key, value.trim());
            else await redisClient.hDel('movecar:settings:system', key); // 清空空值
        }
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
        // 保存所有可能的新通道字段
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