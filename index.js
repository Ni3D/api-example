const express = require('express');
const router  = require('./app/router')
const morgan  = require('morgan');
const path    = require('path');
const dotenv  = require('dotenv').config();

const { sequelize } = require('./app/models');

(async () => {
    await sequelize
        .authenticate()
        .then(() => console.log('Подключение к базе данных: ОК.'))
        .catch((error) => console.error('Подключение к базе данных: FAILED:', error.message));
})();

const app = express();

const port = process.env.APP_PORT;
const host = process.env.APP_HOST;

app.use(morgan('combined'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

router(app);

app.listen(port, host, () => {
    console.log(`Сервер запущен на порту ${port}`);
});
