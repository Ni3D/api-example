const express = require('express');

// Middleware для парсинга JSON тела запроса
const parseBody = express.json();

module.exports = parseBody;