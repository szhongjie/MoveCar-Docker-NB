// src/app.js
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// 引入路由
const pageRoutes = require('./routes/page');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin'); // 【新增】引入后台路由

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json()); 

// 挂载路由
app.use('/', pageRoutes);          
app.use('/api', apiRoutes);        
app.use('/admin', adminRoutes);    // 【新增】将后台路由挂载到 /admin 路径

app.listen(port, () => {
    console.log(`🚀 MoveCar App listening at http://localhost:${port}`);
});