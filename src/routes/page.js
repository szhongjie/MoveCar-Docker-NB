// src/routes/page.js
const express = require('express');
const router = express.Router();
const redisClient = require('../utils/redis');
const { getUserConfig, getBaseDomain } = require('../utils/config');

async function getSafeDomain(req) {
    const domain = await getBaseDomain();
    return domain || `${req.protocol}://${req.get('host')}`;
}

router.get('/qr', async (req, res) => {
    const userKey = (req.query.u || 'default').toLowerCase();
    const config = await getUserConfig(userKey);
    const domain = await getSafeDomain(req);
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
    
    const statusData = await redisClient.get("movecar:status:" + userKey);
    let currentStatus = 'expired';
    
    if (statusData) {
        const parsed = JSON.parse(statusData);
        currentStatus = parsed.status; 
    }

    res.render('confirm', { userKey, carTitle: config.carTitle, currentStatus });
});

module.exports = router;