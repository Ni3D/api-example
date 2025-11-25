const express     = require('express');
const adminRouter = express.Router();

// Маршруты ADMIN
adminRouter.get('/user', (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Список всех пользователей получен", "errCode": 0, "data": data })
})

adminRouter.get('/user/:userId', (req, res) => {
    const data = [];
    const userId = req.params.userId;
    res.status(200).json({ "message": `Данные пользователя с выбранным Id = ${userId} получены`, "errCode": 0, "data": data })
})

adminRouter.delete('/user/:userId', (req, res) => {
    const data = [];
    const userId = req.params.userId;
    res.status(200).json({ "message": `Данные пользователя с выбранным Id = ${userId} удалены`, "errCode": 0, "data": data })
})

module.exports = adminRouter;
