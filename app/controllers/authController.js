const bcrypt = require('bcrypt');
const { User } = require('../models');

module.exports.signupUser = async (req, res) => {
    const { email, password, name } = req.body;
    
    // Хэширование пароля
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Создание пользователя
    const user = await User.create({
        email,
        passwordHash,
        name,
        role: 'user',
        isEmailVerified: false,
        isBlocked: false
    });

    // Ответ от сервера
    const data = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatarUrl: user.avatarUrl,
        isEmailVerified: user.isEmailVerified,
        isBlocked: user.isBlocked,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
    };
    res.status(201).json({ "message": "Регистрация пользователя успешна.", "errCode": 0, "data": data });
}

module.exports.signinUser = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Аутентификация пользователя", "errCode": 0, "data": data })
}

module.exports.recoveryRequest = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Запрос восстановления пароля", "errCode": 0, "data": data })
}

module.exports.recoveryReset = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Сброс пароля по токену", "errCode": 0, "data": data })
}

module.exports.verifyEmail = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Подтверждение email по токену", "errCode": 0, "data": data })
}

module.exports.verifyEmailResend = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Повторная отправка письма подтверждения email", "errCode": 0, "data": data })
}