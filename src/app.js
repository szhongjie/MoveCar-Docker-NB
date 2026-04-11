// src/app.js
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

// 引入拆分好的路由
const pageRoutes = require('./routes/page');
const apiRoutes = require('./routes/api');

// 设置 EJS 模板引擎
app.set('view engine', 'ejs');
// 告诉 express 视图文件放在哪里 (使用绝对路径避免路径错误)
app.set('views', path.join(__dirname, 'views'));

// 中间件
app.use(express.json()); 

// 挂载路由
app.use('/', pageRoutes);          // 页面路由挂载在根路径
app.use('/api', apiRoutes);        // API 路由挂载在 /api 前缀下

// 启动服务器
app.listen(port, () => {
    console.log(`🚀 MoveCar App (Refactored) listening at http://localhost:${port}`);
});