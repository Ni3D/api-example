const express     = require('express');
const authRouter  = express.Router();

// Маршруты AUTH
authRouter.post('/signup', (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Регистрация пользователя", "errCode": 0, "data": data })
})

authRouter.post('/signin', (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Аутентификация пользователя", "errCode": 0, "data": data })
})

module.exports = authRouter;
