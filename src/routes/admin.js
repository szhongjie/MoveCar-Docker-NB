// src/routes/admin.js
const express = require('express');
const router = express.Router();
const redisClient = require('../utils/redis');
const { getBaseDomain } = require('../utils/config');

// 简单的鉴权中间件 (可以去 docker-compose.yml 里加一个 ADMIN_PASSWORD)
const adminAuth = (req, res, next) => {
    const pwd = process.env.ADMIN_PASSWORD || '123456'; // 默认密码 123456
    // 从请求头或 Query 中获取密码
    const token = req.headers['authorization'] || req.query.token;
    if (token === pwd) {
        next();
    } else {
        res.status(401).json({ success: false, error: 'Unauthorized: 密码错误' });
    }
};

// 页面渲染：后台首页
router.get('/', (req, res) => {
    // 渲染管理面板页面
    res.render('admin', { domain: getBaseDomain(req) });
});

// API: 获取所有动态车主列表
router.get('/api/users', adminAuth, async (req, res) => {
    try {
        const usersData = await redisClient.hGetAll('movecar:users');
        const users = Object.keys(usersData).map(key => ({
            userKey: key,
            ...JSON.parse(usersData[key])
        }));
        res.json({ success: true, data: users });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// API: 新增或修改车主
router.post('/api/users', adminAuth, async (req, res) => {
    try {
        const { userKey, carTitle, pushplusToken, barkUrl, phone } = req.body;
        if (!userKey) return res.json({ success: false, error: '必须填写标识码' });

        const userData = { carTitle, pushplusToken, barkUrl, phone };
        await redisClient.hSet('movecar:users', userKey.toLowerCase(), JSON.stringify(userData));
        
        res.json({ success: true, message: '保存成功！即刻生效' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

// API: 删除车主
router.delete('/api/users/:key', adminAuth, async (req, res) => {
    try {
        await redisClient.hDel('movecar:users', req.params.key.toLowerCase());
        res.json({ success: true, message: '删除成功' });
    } catch (e) {
        res.status(500).json({ success: false, error: e.message });
    }
});

module.exports = router;