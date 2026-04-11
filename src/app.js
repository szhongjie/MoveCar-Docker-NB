// src/app.js
const express = require('express');
const path = require('path');
const app = express();
const port = process.env.PORT || 3000;

const pageRoutes = require('./routes/page');
const apiRoutes = require('./routes/api');
const adminRoutes = require('./routes/admin');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.json()); 

app.use('/', pageRoutes);          
app.use('/api', apiRoutes);        
app.use('/admin', adminRoutes);    

app.listen(port, () => {
    console.log(`🚀 MoveCar App listening at http://localhost:${port}`);
});