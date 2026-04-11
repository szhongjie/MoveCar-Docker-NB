// src/routes/page.js
const express = require('express');
const router = express.Router();
const { getUserConfig, getBaseDomain } = require('../utils/config');

// 1. 二维码生成页
router.get('/qr', (req, res) => {
    const userKey = (req.query.u || 'default').toLowerCase();
    const carTitle = getUserConfig(userKey, 'CAR_TITLE') || '车主';
    const targetUrl = getBaseDomain(req) + "/?u=" + userKey;
    
    // 使用 ejs 渲染，并传入变量
    res.render('qr', { userKey, carTitle, targetUrl });
});

// 2. 默认挪车首页
router.get('/', (req, res) => {
    const userKey = (req.query.u || 'default').toLowerCase();
    const phone = getUserConfig(userKey, 'PHONE_NUMBER') || '';
    const carTitle = getUserConfig(userKey, 'CAR_TITLE') || '车主';
    
    res.render('index', { userKey, carTitle, phone });
});

// 3. 车主确认页
router.get('/owner-confirm', (req, res) => {
    const userKey = (req.query.u || 'default').toLowerCase();
    const carTitle = getUserConfig(userKey, 'CAR_TITLE') || '车主';
    
    res.render('confirm', { userKey, carTitle });
});

module.exports = router;