// src/routes/page.js
const express = require('express');
const router = express.Router();
const { getUserConfig, getBaseDomain } = require('../utils/config');

// 1. 二维码生成页
router.get('/qr', async (req, res) => {
    const userKey = (req.query.u || 'default').toLowerCase();
    const config = await getUserConfig(userKey); // 改为 await
    const targetUrl = getBaseDomain(req) + "/?u=" + userKey;
    res.render('qr', { userKey, carTitle: config.carTitle, targetUrl });
});

// 2. 默认挪车首页
router.get('/', async (req, res) => {
    const userKey = (req.query.u || 'default').toLowerCase();
    const config = await getUserConfig(userKey); // 改为 await
    res.render('index', { userKey, carTitle: config.carTitle, phone: config.phone });
});

// 3. 车主确认页
router.get('/owner-confirm', async (req, res) => {
    const userKey = (req.query.u || 'default').toLowerCase();
    const config = await getUserConfig(userKey); // 改为 await
    res.render('confirm', { userKey, carTitle: config.carTitle });
});

module.exports = router;