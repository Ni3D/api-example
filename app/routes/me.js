const express     = require('express');
const meRouter    = express.Router();

// Маршруты ME
meRouter.get('/', (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Данные пользователя получены", "errCode": 0, "data": data })
})

meRouter.patch('/', (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Данные пользователя исправлены", "errCode": 0, "data": data })
})

module.exports = meRouter;
