// src/routes/admin.js
const express = require('express');
const router = express.Router();
const redisClient = require('../utils/redis');
const { getBaseDomain } = require('../utils/config');

const adminAuth = (req, res, next) => {
    const pwd = process.env.ADMIN_PASSWORD || '123456';
    const token = req.headers['authorization'] || req.query.token;
    if (token === pwd) next();
    else res.status(401).json({ success: false, error: 'Unauthorized: 密码错误' });
};

router.get('/', async (req, res) => {
    const domain = await getBaseDomain();
    res.render('admin', { domain });
});

router.post('/api/settings/domain', adminAuth, async (req, res) => {
    try {
        const { domain } = req.body;
        if (!domain) return res.json({ success: false, error: '域名不能为空' });
        await redisClient.set('movecar:settings:domain', domain.trim());
        res.json({ success: true });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.get('/api/users', adminAuth, async (req, res) => {
    try {
        const usersData = await redisClient.hGetAll('movecar:users');
        const users = Object.keys(usersData).map(key => ({
            userKey: key, ...JSON.parse(usersData[key])
        }));
        res.json({ success: true, data: users });
    } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

router.post('/api/users', adminAuth, async (req, res) => {
    try {
        const { userKey, carTitle, pushplusToken, barkUrl, phone } = req.body;
        if (!userKey) return res.json({ success: false, error: '必须填写标识码' });
        await redisClient.hSet('movecar:users', userKey.toLowerCase(), JSON.stringify({ carTitle, pushplusToken, barkUrl, phone }));
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