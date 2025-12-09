const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Op, Model } = require('sequelize');
const { User, RefreshToken, EmailVerificationToken, sequelize } = require('../models');
const JWTService = require('../services/jwt');
const EmailService = require('../services/emailService');

// Регистрация пользователя
module.exports.signupUser = async (req, res) => {
    try {
        // Получение данных из тела запроса
        const { email, password, name } = req.body;

        // Проверка наличия email, пароля и имени в запросе
        if (!email || !password || !name) {
            return res.status(400).json({
                "message": "Email, пароль и имя обязательны",
                "errCode": 1,
            });
        }

        // Поиск указанного email в базе перед регистрацией
        const emailCheck = await User.findOne({ where: { email } });
        
        if (emailCheck) {
            return res.status(409).json({
                "message": "Пользователь с данным email уже зарегистрирован",
                "errCode": 1,
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

        // Генерация токена для подтверждения email
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Сохранение токена для подтверждения email в базу
        await EmailVerificationToken.create({
            userId: user.id,
            token: verificationToken,
            expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), 
            usedAt: null
        });

        // Формируем ссылку для подтверждения
        const verificationLink = `${process.env.APP_URL}/api/v1/auth/verify?token=${verificationToken}`;

        // Отправляем email с подтверждением
        EmailService.sendVerificationEmail(email, name, verificationLink)
            .then(result => {
                console.log('Письмо с подтверждением отправлено:', result);
            })
            .catch(error => {
                console.error('Ошибка отправки письма:', error);
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

        res.status(201).json({
            "message": "Регистрация пользователя успешна.",
            "errCode": 0,
            "data": data
        });

    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.status(500).json({
            "message": "Ошибка сервера при регистрации",
            "errCode": 1,
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
            });
        }

        // Поиск пользователя
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({
                "message": "Неверный email или пароль",
                "errCode": 1,
            });
        }

        // Проверка пароля
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({
                "message": "Неверный email или пароль",
                "errCode": 1,
            });
        }

        // Проверка блокировки пользователя
        if (user.isBlocked) {
            return res.status(403).json({
                "message": "Пользователь заблокирован",
                "errCode": 1,
            });
        }

        // Удаление просроченных токенов
        await RefreshToken.destroy({
            where: {
                userId: user.id,
                expiresAt: { [Op.lt]: new Date() }
            }
        });

        // Удаление отозванных токенов
        await RefreshToken.destroy({
            where: {
                userId: user.id,
                isRevoked: true
            }
        });

        // Ограничение: максимум 5 активных токенов на пользователя
        const maxTokensPerUser = 5;
        
        // Получаем текущее количество активных токенов
        const activeTokens = await RefreshToken.count({
            where: {
                userId: user.id,
                isRevoked: false,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        // Если достигли лимита, удаляем самый старый токен
        if (activeTokens >= maxTokensPerUser) {
            const oldestToken = await RefreshToken.findOne({
                where: {
                    userId: user.id,
                    isRevoked: false,
                    expiresAt: { [Op.gt]: new Date() }
                },
                order: [['createdAt', 'ASC']]
            });

            if (oldestToken) {
                await oldestToken.destroy();
            }
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
        });
    }
}

module.exports.signoutUser = async (req, res) => {
    try {
        // Получаем refresh токен из тела запроса
        const { refreshToken } = req.body;

        // Проверяем передан ли токен
        if (!refreshToken) {
            return res.status(400).json({
                "message": "Refresh токен обязателен для выхода",
                "errCode": 1,
            });
        }

        // Ищем неотозванный токен в базе
        const tokenCheck = await RefreshToken.findOne({
            where: {
                token: refreshToken,
                isRevoked: false
            }
        });

        // Отвечаем если токен не найден или отозван
        if (!tokenCheck) {
            return res.status(404).json({
                "message": "Токен не найден или уже отозван",
                "errCode": 1,
            });
        }

        // Отзываем токен
        await tokenCheck.update({ isRevoked: true });

        // Удаляем отозванные токены
        await RefreshToken.destroy({
            where: {
                userId: tokenCheck.userId,
                isRevoked: true
            }
        });

        res.status(200).json({
            "message": "Выход выполнен успешно",
            "errCode": 0,
        });

    } catch (error) {
        console.error('Ошибка при выходе:', error);
        res.status(500).json({
            "message": "Ошибка сервера при выходе",
            "errCode": 1,
        });
    }
}

module.exports.verifyEmail = async (req, res) => {
    try {
        const { token } = req.query;

        if (!token) {
            return res.status(400).json({
                "message": "Токен подтверждения обязателен",
                "errCode": 1
            });
        }

        // Ищем токен в базе
        const verificationToken = await EmailVerificationToken.findOne({
            where: {
                token: token,
                usedAt: null,
                expiresAt: { [Op.gt]: new Date() }
            },            
            include: [{ model: User }]
        });

        if (!verificationToken) {
            return res.status(400).json({
                "message": "Недействительный или просроченный токен",
                'errCode': 1
            });
        }

        // Проверяем, не подтвержден ли уже email
        if (verificationToken.User.isEmailVerified) {
            await verificationToken.update({ usedAt: new Date() });

            return res.status(200).json({
                "message": "Email уже подтвержден",
                "errCode": 0,
            });
        }

        // Помечаем email как подтвержденный
        await verificationToken.User.update({ isEmailVerified: true });

        // Помечаем токен как использованный
        await verificationToken.update({ usedAt: new Date() });

        // Удаляем все старые токены пользователя
        await EmailVerificationToken.destroy({
            where: {
                userId: verificationToken.User.id,
                usedAt: null,
                expiresAt: { [Op.lt]: new Date()}
            }
        });

        res.status(200).json({
            "message": "Email успешно подтвержден",
            "errCode": 0,
            "date": {
                userId: verificationToken.User.id,
                email: verificationToken.User.email,
                name: verificationToken.User.name,
                isEmailVerified: true
            }
        });

    } catch (error) {
        console.error('Ошибка при подтверждении email:', error);
        res.status(500).json({
            "message": "Ошибка сервера при подтверждении email",
            "errCode": 1
        });
    }
}

module.exports.verifyEmailResend = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Повторная отправка письма подтверждения email", "errCode": 0, "data": data })
}

module.exports.recoveryRequest = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Запрос восстановления пароля", "errCode": 0, "data": data })
}

module.exports.recoveryReset = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Сброс пароля по токену", "errCode": 0, "data": data })
}
