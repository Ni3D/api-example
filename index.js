const express = require('express');
const router  = require('./app/router')
const morgan  = require('morgan');
const dotenv  = require('dotenv').config();

const { sequelize } = require('./app/models');

(async () => {
    await sequelize
        .authenticate()
        .then(() => console.log('Connection to database: OK.'))
        .catch((error) => console.error('Connection to database: FAILED:', error.message));
})();

const app = express();

const port = process.env.APP_PORT;
const host = process.env.APP_HOST;

app.use(morgan('combined'))

router(app);

app.listen(port, host, () => { console.log(`Сервер запущен на порту ${port}`); })
