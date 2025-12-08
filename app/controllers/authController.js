const bcrypt = require('bcrypt');
const { User, RefreshToken } = require('../models');
const JWTService = require('../services/jwt');
const { where } = require('sequelize');

// Регистрация пользователя
module.exports.signupUser = async (req, res) => {
    try {
        // Получение данных из тела запроса
        const { email, password, name } = req.body;

        // Проверка наличия email, пароля и имени
        if (!email || !password || !name) {
            return res.status(400).json({
                "message": "Email, пароль и имя обязательны",
                "errCode": 1,
                "data": null
            });
        }

        // Поиск email в базе перед регистрацией
        const emailCheck = await User.findOne({ where: { email } });
        
        if (emailCheck) {
            return res.status(401).json({
                "message": "Пользователь с данным email уже зарегистрирован",
                "errCode": 1,
                "data": null
            });
        }
        
        // Хэширование пароля
        const saltRounds = 10;
        const passwordHash = await bcrypt.hash(password, saltRounds);
        
        // Создание пользователя в базе данных
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

    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.status(500).json({
            "message": "Ошибка сервера при регистрации",
            "errCode": 1,
            "data": null
        });
    }
}

// Аутентификация пользователя
module.exports.signinUser = async (req, res) => {
    try {
        // Получение данных из тела запроса
        const { email, password } = req.body;

        // Проверка наличия email и пароля
        if (!email || !password) {
            return res.status(400).json({
                "message": "Email и пароль обязательны",
                "errCode": 1,
                "data": null
            });
        }

        // Поиск пользователя
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({
                "message": "Неверный email или пароль",
                "errCode": 1,
                "data": null
            });
        }

        // Проверка пароля
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({
                "message": "Неверный email или пароль",
                "errCode": 1,
                "data": null
            });
        }

        // Проверка блокировки пользователя
        if (user.isBlocked) {
            return res.status(403).json({
                "message": "Пользователь заблокирован",
                "errCode": 1,
                "data": null
            });
        }

        // Генерация токенов
        const accessToken  = JWTService.generateAccessToken(user);
        const refreshToken = JWTService.generateRefreshToken(user);

        // Сохранение refresh токена в базу данных
        await RefreshToken.create({
            userId: user.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 дней
            isRevoked: false
        });

        // Формирование ответа
        const data = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                avatarUrl: user.avatarUrl,
                isEmailVerified: user.isEmailVerified,
                isBlocked: user.isBlocked,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            },
            tokens: {
                accessToken,
                refreshToken
            }
        };

        res.status(200).json({
            "message": "Аутентификация успешна",
            "errCode": 0,
            "data": data
        });

    } catch (error) {
        console.error('Ошибка при входе:', error);
        res.status(500).json({
            "message": "Ошибка сервера при аутентификации",
            "errCode": 1,
            "data": null
        });
    }
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
