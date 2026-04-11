// src/routes/page.js
const express = require('express');
const router = express.Router();
const { getUserConfig, getBaseDomain } = require('../utils/config');

router.get('/qr', async (req, res) => {
    const userKey = (req.query.u || 'default').toLowerCase();
    const config = await getUserConfig(userKey);
    const domain = await getBaseDomain(req); // 改为 await
    const targetUrl = domain + "/?u=" + userKey;
    res.render('qr', { userKey, carTitle: config.carTitle, targetUrl });
});

router.get('/', async (req, res) => {
    const userKey = (req.query.u || 'default').toLowerCase();
    const config = await getUserConfig(userKey);
    res.render('index', { userKey, carTitle: config.carTitle, phone: config.phone });
});

router.get('/owner-confirm', async (req, res) => {
    const userKey = (req.query.u || 'default').toLowerCase();
    const config = await getUserConfig(userKey);
    res.render('confirm', { userKey, carTitle: config.carTitle });
});

module.exports = router;