const express = require('express');
const morgan = require('morgan');
const app = express();

const dotenv = require('dotenv').config();

const port = process.env.APP_PORT;
const host = process.env.APP_HOST;

app.use(morgan('combined'))

app.get('/api/v1', (req, res) => {
    const data = [];
    res.status(200).json({"message": "API сервиса управления задачами", "errCode": 0, "data": data})
})

// Маршруты AUTH
app.post('/api/v1/auth/signup', (req, res) => {
    const data = [];
    res.status(200).json({"message": "Регистрация пользователя", "errCode": 0, "data": data})
})

app.post('/api/v1/auth/signin', (req, res) => {
    const data = [];
    res.status(200).json({"message": "Аутентификация пользователя", "errCode": 0, "data": data})
})

// Маршруты ME
app.get('/api/v1/me', (req, res) => {
    const data = [];
    res.status(200).json({"message": "Данные пользователя получены", "errCode": 0, "data": data})
})

app.patch('/api/v1/me', (req, res) => {
    const data = [];
    res.status(200).json({"message": "Данные пользователя исправлены", "errCode": 0, "data": data})
})

// Маршруты ADMIN
app.get('/api/v1/admin/user', (req, res) => {
    const data = [];
    res.status(200).json({"message": "Список всех пользователей получен", "errCode": 0, "data": data})
})

app.get('/api/v1/admin/user/:userId', (req, res) => {
    const data = [];
    const userId = req.params.userId;
    res.status(200).json({"message": `Данные пользователя с выбранным Id = ${userId} получены`, "errCode": 0, "data": data})
})

app.delete('/api/v1/admin/user/:userId', (req, res) => {
    const data = [];
    const userId = req.params.userId;
    res.status(200).json({"message": `Данные пользователя с выбранным Id = ${userId} удалены`, "errCode": 0, "data": data})
})

app.use((req, res) => {
    res.status(404).json({"message": "Маршрут не существует", "errCode": 100})
})

app.listen(port, host, () => { console.log(`Сервер запущен на порту ${port}`); })