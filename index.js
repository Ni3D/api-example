const express = require('express');
const router  = require('./app/router')
const morgan  = require('morgan');
const dotenv  = require('dotenv').config();

const { sequelize } = require('./app/models');

const app = express();

const port = process.env.APP_PORT;
const host = process.env.APP_HOST;

// Middleware для парсинга json
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan('combined'))

router(app);

app.listen(port, host, () => { console.log(`Сервер запущен на порту ${port}`); })
