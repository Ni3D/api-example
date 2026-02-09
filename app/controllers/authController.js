const bcrypt = require('bcrypt');
const crypto = require('crypto');
const { Op } = require('sequelize');
const { User, RefreshToken, EmailVerificationToken, PasswordResetToken } = require('../models');
const JWTService = require('../services/jwt');
const EmailService = require('../services/emailService');
const { ERROR_CODES } = require('../utils/errorCodes');
const { timeParser } = require('../utils/timeParser');

// Регистрация пользователя
module.exports.signupUser = async (req, res) => {
    try {
        // Получение данных из тела запроса
        const { email, password, name } = req.body;

        // Проверка наличия email, пароля и имени в запросе
        if (!email || !password || !name) {
            return res.status(400).json({
                "message": "Email, пароль и имя обязательны",
                "errCode": ERROR_CODES.BEAR
            });
        }

        // Поиск указанного email в базе перед регистрацией
        const emailCheck = await User.findOne({ where: { email } });

        if (emailCheck) {
            return res.status(409).json({
                "message": "Пользователь с данным email уже зарегистрирован",
                "errCode": ERROR_CODES.RHINO
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
            expiresAt: new Date(Date.now() + timeParser(process.env.EMAIL_VERIFICATION_EXPIRES)),
            usedAt: null
        });

        // Формируем ссылку для подтверждения
        const verificationLink = `${process.env.APP_URL}/api/v1/auth/verify?token=${verificationToken}`;

        // Отправляем email с подтверждением
        setImmediate(async () => {
            try {
                await EmailService.sendVerificationEmail(email, name, verificationLink);
            } catch (error) {
                console.error('Ошибка при отправке email:', error);
            }
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
            "message": "Регистрация успешна! Подтвердите учетную запись, " +
                "перейдя по ссылке из письма, отправленного на указанный почтовый ящик.",
            "errCode": 0,
            "data": data
        });

    } catch (error) {
        console.error('Ошибка при регистрации:', error);
        res.status(500).json({
            "message": "Ошибка сервера при регистрации",
            "errCode": ERROR_CODES.WHALE
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
                "errCode": ERROR_CODES.BEAR
            });
        }

        // Поиск пользователя
        const user = await User.findOne({ where: { email } });

        if (!user) {
            return res.status(401).json({
                "message": "Неверный email или пароль",
                "errCode": ERROR_CODES.LION
            });
        }

        // Проверка пароля
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

        if (!isPasswordValid) {
            return res.status(401).json({
                "message": "Неверный email или пароль",
                "errCode": ERROR_CODES.LION
            });
        }

        // Проверка подтверждения email
        if (!user.isEmailVerified) {
            return res.status(400).json({
                "message": "Email не подтвержден. Подтвердите email, перейдя по ссылке из письма, отправленного на почтовый ящик",
                "errCode": ERROR_CODES.BEAR
            });
        }

        // Проверка блокировки пользователя
        if (user.isBlocked) {
            return res.status(403).json({
                "message": "Пользователь заблокирован",
                "errCode": ERROR_CODES.SHARK
            });
        }

        // Удаление просроченных и отозванных токенов
        await RefreshToken.destroy({
            where: {
                userId: user.id,
                [Op.or]: [
                    { expiresAt: { [Op.lt]: new Date() } },
                    { isRevoked: true }
                ]
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
        const accessToken = JWTService.generateAccessToken(user.id);
        const refreshToken = JWTService.generateRefreshToken(user.id);

        // Сохранение refresh токена в базу данных
        await RefreshToken.create({
            userId: user.id,
            token: refreshToken,
            expiresAt: new Date(Date.now() + timeParser(process.env.JWT_REFRESH_EXPIRES || '7d')),
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
        console.error('Ошибка при аутентификации:', error);
        res.status(500).json({
            "message": "Ошибка сервера при аутентификации",
            "errCode": ERROR_CODES.WHALE
        });
    }
}

// Выход пользователя
module.exports.signoutUser = async (req, res) => {
    try {
        // Получаем refresh токен из тела запроса
        const { refreshToken } = req.body;

        // Проверяем передан ли токен
        if (!refreshToken) {
            return res.status(400).json({
                "message": "Refresh токен обязателен для выхода",
                "errCode": ERROR_CODES.BEAR,
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
                "errCode": ERROR_CODES.ELEPHANT,
            });
        }

        // Отзываем токен
        await tokenCheck.update({ isRevoked: true });

        // Удаляем просроченные токены
        await RefreshToken.destroy({
            where: {
                userId: tokenCheck.userId,
                isRevoked: true,
                expiresAt: { [Op.lt]: new Date() }
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
            "errCode": ERROR_CODES.WHALE
        });
    }
}

// Подтверждение email
module.exports.verifyEmail = async (req, res) => {
    try {
        // Получаем токен из запроса
        const { token } = req.query;

        // Проверяем есть токен в запросе
        if (!token) {
            return res.status(400).json({
                "message": "Токен подтверждения обязателен",
                "errCode": ERROR_CODES.BEAR
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
                'errCode': ERROR_CODES.WOLF
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
                expiresAt: { [Op.lt]: new Date() }
            }
        });

        const data = {
            userId: verificationToken.User.id,
            email: verificationToken.User.email,
            name: verificationToken.User.name,
            isEmailVerified: true
        };

        res.status(200).json({
            "message": "Email успешно подтвержден",
            "errCode": 0,
            "data": data
        });

    } catch (error) {
        console.error('Ошибка при подтверждении email:', error);
        res.status(500).json({
            "message": "Ошибка сервера при подтверждении email",
            "errCode": ERROR_CODES.WHALE
        });
    }
}

// Повторный запрос на подтвреждение email
module.exports.verifyEmailResend = async (req, res) => {
    try {
        // Получаем email из тела запроса
        const { email } = req.body;

        // Проверяем наличие email в запросе
        if (!email) {
            return res.status(400).json({
                "message": "Необходимо указать Email.",
                "errCode": ERROR_CODES.BEAR
            });
        }

        // Ищем пользователя по email в базе
        const user = await User.findOne({ where: { email } });

        // Если пользователь не найден - сообщаем об этом
        if (!user) {
            return res.status(200).json({
                "message": "Пользователь с таким Email не найден",
                "errCode": 0
            });
        }

        // Проверяем, подтвержден ли уже email
        if (user.isEmailVerified) {
            return res.status(200).json({
                "message": "Email уже подтвержден",
                "errCode": 0
            });
        }

        // Удаляем старые непросроченные токены подтверждения email
        await EmailVerificationToken.destroy({
            where: {
                userId: user.id,
                usedAt: null,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        // Генерируем новый токен подтверждения email
        const verificationToken = crypto.randomBytes(32).toString('hex');

        // Сохраняем новый токен подтверждения email в базу
        await EmailVerificationToken.create({
            userId: user.id,
            token: verificationToken,
            expiresAt: new Date(Date.now() + timeParser(process.env.EMAIL_VERIFICATION_EXPIRES)),
            usedAt: null
        });

        // Формируем ссылку для подтверждения
        const verificationLink = `${process.env.APP_URL}/api/v1/auth/verify?token=${verificationToken}`;

        // Отправляем email
        setImmediate(async () => {
            try {
                await EmailService.sendVerificationEmail(email, user.name, verificationLink);
            } catch (error) {
                console.error('Ошибка при отправке email:', error);
            }
        });

        // Ответ сервера
        res.status(200).json({
            "message": "Письмо с подтверждением отправлено",
            "errCode": 0
        });

    } catch (error) {
        console.error('Ошибка при повторной отправке письма:', error);
        res.status(500).json({
            "message": "Ошибка сервера при отправке письма",
            "errCode": ERROR_CODES.WHALE
        });

    }
}

// Запрос на восстановление пароля
module.exports.recoveryRequest = async (req, res) => {
    try {
        // Получаем email из тела запроса
        const { email } = req.body

        // Проверяем наличие email в базе
        if (!email) {
            return res.status(400).json({
                "message": "Email обязателен для восстановления пароля",
                "errCode": ERROR_CODES.BEAR
            });
        }

        // Ищем пользователя по email в базе
        const user = await User.findOne({ where: { email } });

        // Если пользователь не найден - сообщаем об этом
        if (!user) {
            return res.status(200).json({
                "message": "Пользователь с таким Email не найден",
                "errCode": 0
            });
        }

        // Проверяем, не заблокирован ли пользователь
        if (user.isBlocked) {
            return res.status(403).json({
                "message": "Пользователь заблокирован",
                "errCode": ERROR_CODES.SHARK
            });
        }

        // Удаляем старый токен восстановления пароля
        await PasswordResetToken.destroy({
            where: {
                userId: user.id,
                usedAt: null,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        // Генерируем токен восстановления пароля
        const resetToken = crypto.randomBytes(32).toString('hex');

        // Сохраняем токен восстановления пароля в базу
        await PasswordResetToken.create({
            userId: user.id,
            token: resetToken,
            expiresAt: new Date(Date.now() + timeParser(process.env.PASSWORD_RESET_EXPIRES)),
            usedAt: null
        });

        // Формируем ссылку для восстановления пароля
        const resetLink = `${process.env.APP_URL}/recovery/request?token=${resetToken}`;

        // Отправляем email для восстановления пароля
        setImmediate(async () => {
            try {
                await EmailService.sendPasswordResetEmail(email, user.name, resetLink);
            } catch (error) {
                console.error('Ошибка при отправке email:', error);
            }
        });

        //Ответ от сервера
        res.status(200).json({
            "message": "Инструкции по восстановлению пароля отправлены на email",
            "errCode": 0
        });

    } catch (error) {
        console.error('Ошибка при запросе восстановления пароля:', error);
        res.status(500).json({
            "message": "Ошибка сервера при запросе восстановления пароля",
            "errCode": ERROR_CODES.WHALE
        });
    }
}

// Сброс пароля
module.exports.recoveryReset = async (req, res) => {
    try {
        // Получаем токен восстановления и новый пароль из тела запроса
        const { token, newPassword } = req.body;

        // Проверяем наличие токена и нового пароля
        if (!token || !newPassword) {
            return res.status(400).json({
                "message": "Токен и новый пароль обязательны",
                "errCode": ERROR_CODES.BEAR
            });
        }

        // Ищем токен в базе
        const resetToken = await PasswordResetToken.findOne({
            where: {
                token: token,
                usedAt: null,
                expiresAt: { [Op.gt]: new Date() }
            },
            include: [{ model: User }]
        });

        if (!resetToken) {
            return res.status(400).json({
                "message": "Недействительный токен",
                "errCode": ERROR_CODES.WOLF
            });
        }

        // Проверяем, заблокирован ли пользователь
        if (resetToken.User.isBlocked) {
            return res.status(403).json({
                "message": "Пользователь заблокирован",
                "errCode": ERROR_CODES.SHARK
            });
        }

        // Хэшируем новый пароль
        const saltRounds = 10;
        const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

        // Обновляем пароль пользователя
        await resetToken.User.update({
            passwordHash: newPasswordHash
        });

        // Помечаем токен как использованный
        await resetToken.update({ usedAt: new Date() });

        // Удаляем все refresh токены пользователя
        await RefreshToken.destroy({
            where: { userId: resetToken.User.id }
        });

        // Удаляем все активные токены восстановления пользователя
        await PasswordResetToken.destroy({
            where: {
                userId: resetToken.User.id,
                usedAt: null,
                expiresAt: { [Op.gt]: new Date() }
            }
        });

        // Ответ сервера
        const data = {
            userId: resetToken.User.id,
            email: resetToken.User.email,
            name: resetToken.User.name
        };

        res.status(200).json({
            "message": "Пароль успешно изменен",
            "errCode": 0,
            "data": data
        });

    } catch (error) {
        console.error('Ошибка при сбросе пароля:', error);
        res.status(500).json({
            "message": "Ошибка сервера при сбросе пароля",
            "errCode": ERROR_CODES.WHALE
        });
    }
}
