const bcrypt = require('bcrypt');
const crypto = require('crypto');
const path   = require('path');
const fs     = require('fs').promises;
const { Op } = require('sequelize');
const { User, EmailVerificationToken } = require('../models');
const EmailService = require('../services/emailService');
const { error } = require('console');

const ERROR_CODES = {
    BEAR: 1001,     // Ошибка валидации
    LION: 2001,     // Неверные учетные данные
    WOLF: 2002,     // Несанкционированный доступ
    SHARK: 3001,    // Пользователь заблокирован
    ELEPHANT: 4001, // Ресурс не найден
    RHINO: 4002,    // Конфликт (дубликат)
    WHALE: 5001,    // Серверная ошибка
};

// Путь к папке с аватарами
const AVATARS_DIR = path.join(__dirname, '../../uploads/avatars');

module.exports.getProfile = async (req, res) => {
    try {

        const data = {
            id: req.user.id,
            name: req.user.name,
            email: req.user.email,
            role: req.user.role,
            avatarUrl: req.user.avatarUrl,
            isEmailVerified: Boolean(req.user.isEmailVerified),
            isBlocked: Boolean(req.user.isBlocked),
            createdAt: req.user.createdAt,
            updatedAt: req.user.updatedAt
        }

        res.status(200).json({
            "message": "Данные пользователя получены.",
            "errCode": 0,
            "data": data
        });

    } catch (error) {
        console.error('Ошибка при получении данных пользователя:', error);
        res.status(500).json({
            "message": "Ошибка сервера при получении данных пользователя",
            "errCode": 1
        });
    }

}

module.exports.updateProfile = async (req, res) => {
    try {
        // Получаем данные из тела запроса
        const { name, email, password, newPassword } = req.body;

        // Проверяем, что передано хотябы одно поле для обновления
        if (!name && !email && !newPassword) {
            return res.status(400).json({
                "message": "Нужно указать хотябы одно поле для обновления",
                "errCode": ERROR_CODES.BEAR
            });
        }

        // Ищем пользователя в БД
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({
                "message": "Пользователь не найден",
                "errCode": ERROR_CODES.ELEPHANT
            });
        }

        // Проверяем, не заблокирован ли пользователь
        if (user.isBlocked) {
            return res.status(403).json({
                "message": "Пользователь заблокирован",
                "errCode": ERROR_CODES.SHARK
            });
        }

        // Объект для хранения изменений
        const updates = {};
        let emailChanged = false;
        let passwordChanged = false;

        // Обновление имени (если передано и отличается от текущего)
        if (name && name !== user.name) {
            updates.name = name;
        }

        // Обновление email (если передан и отличается от текущего)
        if (email && email !== user.email) {
            // Проверяем уникальность email (только если email действительно передан)
            const existingUser = await User.findOne({ where: { email } });
            if (existingUser && existingUser.id !== user.id) {
                return res.status(409).json({
                    "message": "Пользователь с таким email уже существует",
                    "errCode": ERROR_CODES.RHINO
                });
            }

            updates.email = email;
            updates.isEmailVerified = false;
            emailChanged = true;
        }

        // Обновление пароля (если передан)
        if (newPassword) {
            // Проверяем, передан ли текущий пароль
            if (!password) {
                return res.status(400).json({
                    "message": "Для изменения пароля необходимо указать текущий пароль",
                    "errCode": ERROR_CODES.BEAR
                });
            }

            // Проверяем текущий пароль
            const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                return res.status(401).json({
                    "message": "Неверный текущий пароль",
                    "errCode": ERROR_CODES.LION
                });
            }

            // Хэшируем новый пароль
            const saltRounds = 10;
            updates.passwordHash = await bcrypt.hash(newPassword, saltRounds);
            passwordChanged = true;
        }

        // Ответ, если нет изменений
        if (Object.keys(updates).length === 0) {
            const userData = {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatarUrl: user.avatarUrl,
                isEmailVerified: Boolean(user.isEmailVerified),
                isBlocked: Boolean(user.isBlocked),
                createdAt: user.createdAt,
                updatedAt: user.updatedAt
            };
            
            return res.status(200).json({
                "message": "Нет изменений для обновления",
                "errCode": 0,
                "data": userData
            });
        }

        // Применяем изменения
        await user.update(updates);

        // Если сменился email, генерируем токен подтверждения
        if (emailChanged) {
            // Удаляем старые непросроченные токены подтверждения
            await EmailVerificationToken.destroy({
                where: {
                    userId: user.id,
                    usedAt: null,
                    expiresAt: { [Op.gt]: new Date() }
                }
            });

            // Генерируем новый токен
            const verificationToken = crypto.randomBytes(32).toString('hex');

            // Сохраняем токен в базу
            await EmailVerificationToken.create({
                userId: user.id,
                token: verificationToken,
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
                usedAt: null
            });

            // Формируем ссылку подтверждения
            const verificationLink = `${process.env.APP_URL}/api/v1/auth/verify?token=${verificationToken}`;

            // Отправляем email с подтверждением
            EmailService.sendVerificationEmail(email, user.name, verificationLink)
                .then(result => {
                    console.log('Письмо с подтверждением нового email отправлено:', result);
                })
                .catch(error => {
                    console.error('Ошибка отправки письма подтверждения:', error);
                });
        }

        // Если изменился пароль, отправляем уведомление
        if (passwordChanged) {
            EmailService.sendPasswordChangeEmail(user.email, user.name)
                .then(result => {
                    console.log('Уведомление об изменении пароля отправлено:', result);
                })
                .catch(error => {
                    console.error('Ошибка отправки уведомления об изменении пароля:', error);
                });
        }

        // Получаем обновленные данные пользователя
        const updatedUser = await User.findByPk(user.id, {
            attributes: { exclude: ['passwordHash'] }
        });

        // Формируем ответ
        const data = {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            avatarUrl: updatedUser.avatarUrl,
            isEmailVerified: Boolean(updatedUser.isEmailVerified),
            isBlocked: Boolean(updatedUser.isBlocked),
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt
        };

        // Сообщение в зависимости от изменений
        let message = "Профиль успешно обновлен";
        if (emailChanged) message += ". На новый email отправлено письмо с подтверждением";
        if (passwordChanged) message += ". На email отправлено уведомление об изменении пароля";

        res.status(200).json({
            "message": message,
            "errCode": 0,
            "data": data
        });

    } catch (error) {
        console.error('Ошибка при обновлении профиля:', error);
        res.status(500).json({
            "message": "Ошибка сервера при обновлении профиля",
            "errCode": ERROR_CODES.WHALE
        });
    }
}

module.exports.deleteProfile = async (req, res) => {
    try {
        // Получаем пароль из тела запроса
        const { password } = req.body;

        // Проверяем наличие пароля
        if (!password) {
            return res.status(400).json({
                "message": "Для удаления профиля необходимо указать пароль",
                "errCode": ERROR_CODES.BEAR
            });
        }

        // Ищем пользователя в БД
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({
                "message": "Пользователь не найден",
                "errCode": ERROR_CODES.ELEPHANT
            });
        }

        // Проверяем, не заблокирован ли пользователь
        if (user.isBlocked) {
            return res.status(403).json({
                "message": "Пользователь заблокирован",
                "errCode": ERROR_CODES.SHARK
            });
        }

        // Проверяем пароль
        const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                "message": "Неверный пароль",
                "errCode": ERROR_CODES.LION
            });
        }

        // Сохраняем данные пользователя для email уведомления
        const userId = user.id
        const userName = user.name;
        const userEmail = user.email;

        // Удаляем все данные пользователя
        await user.destroy();

        // Формируем ответ
        const data = {
            userId: userId,
            userName: userName,
            email: userEmail,
            deletedAt: new Date()
        };

        res.status(200).json({
            "message": "Аккаунт успешно удален",
            "errCode": 0,
            "data": data
        });

        // Отправляем email уведомление об удалении
        EmailService.sendAccountDeletionEmail(userEmail, userName)
            .then(result => {
                console.log('Уведомление об удалении аккаунта отправлено:', result);
            })
            .catch(error => {
                console.error('Ошибка при отправке уведомления:', error);
            });

    } catch (error) {
        console.error('Ошибка при удалении профиля:', error);
        res.status(500).json({
            "message": "Ошибка сервера при удалении профиля",
            "errCode": ERROR_CODES.WHALE
        });
    }
}

module.exports.uploadAvatar = async (req, res) => {
    try {
        // Проверяем, загружен ли файл
        if (!req.file) {
            return res.status(400).json({
                "message": "Файл не загружен. Пожалуйста, выберите файл для загрузки.",
                "errCode": ERROR_CODES.BEAR
            });
        }

        // Ищем пользователя в БД
        const user = await User.findByPk(req.user.id);

        if (!user) {
            // Удаляем загруженный файл, если пользователь не найден
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Ошибка при удалени загруженного файла:', unlinkError);
            }

            return res.status(404).json({
                "message": "Пользователь не найден",
                "errCode": ERROR_CODES.ELEPHANT
            });
        }

        // Проверяем, не заблокирован ли пользователь
        if (user.isBlocked) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Ошибка при удалени загруженного файла:', unlinkError);
            }

            return res.status(403).json({
                "message": "Пользователь заблокирован",
                "errCode": ERROR_CODES.SHARK
            });
        }

        // Удаляем старый аватар, если он существует
        if (user.avatarUrl) {
            try {
                // Извлекаем имя файла из URL
                const oldFilename = path.basename(user.avatarUrl);
                const oldFilePath = path.join(AVATARS_DIR, oldFilename);

                await fs.unlink(oldFilePath);
            } catch (unlinkError) {
                if (unlinkError.code !== 'ENOENT') {
                    console.error('Ошибка  при удалении  старого аватара:', unlinkError);
                }
            }
        }

        // Форимруем URL для нового аватара
        const avatarUrl = `/uploads/avatars/${req.file.filename}`;

        // Обновляем аватар в БД
        await user.update({ avatarUrl });

        // Получаем обновленные данные пользователя
        const updatedUser = await User.findByPk(user.id, {
            attributes: { exclude: ['passwordHash'] }
        });

        // Формируем ответ
        const data = {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            avatarUrl: updatedUser.avatarUrl,
            isEmailVerified: Boolean(updatedUser.isEmailVerified),
            isBlocked: Boolean(updatedUser.isBlocked),
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt
        };

        res.status(200).json({
            "message": "Аватар успешно загружен",
            "errCode": 0,
            "data": data
        });

    } catch (error) {
        // Удаляем загруженный файл при ошибке
        if (req.file) {
            try {
                await fs.unlink(req.file.path);
            } catch (unlinkError) {
                console.error('Ошибка при удалении загруженного файла после ошибки:', unlinkError);
            }
        }

        console.error('Ошибка при загрузке аватара:', error);
        
        // Обработка ошибок multer
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                "message": "Файл слишком большой. Максимальный размер: 5MB",
                "errCode": ERROR_CODES.BEAR
            });
        }

        res.status(500).json({
            "message": "Ошибка сервера при загрузке аватара",
            "errCode": ERROR_CODES.WHALE
        });
    }
}

module.exports.deleteAvatar = async (req, res) => {
    try {
        // Ищем пользователя в БД
        const user = await User.findByPk(req.user.id);

        if (!user) {
            return res.status(404).json({
                "message": "Пользователь не найден",
                "errCode": ERROR_CODES.ELEPHANT
            });
        }

        // Проверяем, не заблокирован ли пользователь
        if (user.isBlocked) {
            return res.status(403).json({
                "message": "Пользователь заблокирован",
                "errCode": ERROR_CODES.SHARK
            });
        }

        // Проверяем, есть ли у пользователя аватар
        if (!user.avatarUrl) {
            return res.status(404).json({
                "message": "Аватар не найден",
                "errCode": ERROR_CODES.ELEPHANT
            });
        }

        // Извлекаем имя файла из URL
        const filename = path.basename(user.avatarUrl);
        const filePath = path.join(AVATARS_DIR, filename);

        try {
            // Удаляем файл аватара
            await fs.unlink(filePath);
            console.log('Аватар удален:', filePath);
        } catch (unlinkError) {
            // Если файл не найден, продолжаем выполнение
            if (unlinkError.code !== 'ENOENT') {
                console.error('Ошибка при удалении файла аватара:', unlinkError);
            }
        }

        // Обновляем запись пользователя (удаляем ссылку на аватар)
        await user.update({ avatarUrl: null });

        // Получаем обновленные данные пользователя
        const updatedUser = await User.findByPk(user.id, {
            attributes: { exclude: ['passwordHash'] }
        });

        // Формируем ответ
        const data = {
            id: updatedUser.id,
            name: updatedUser.name,
            email: updatedUser.email,
            role: updatedUser.role,
            avatarUrl: updatedUser.avatarUrl,
            isEmailVerified: Boolean(updatedUser.isEmailVerified),
            isBlocked: Boolean(updatedUser.isBlocked),
            createdAt: updatedUser.createdAt,
            updatedAt: updatedUser.updatedAt
        };

        res.status(200).json({
            "message": "Аватар успешно удален",
            "errCode": 0,
            "data": data
        });

    } catch (error) {
        console.error('Ошибка при удалении аватара:', error);
        res.status(500).json({
            "message": "Ошибка сервера при удалении аватара",
            "errCode": ERROR_CODES.WHALE
        });
    }
}

module.exports.createTask = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Новая задача создана", "errCode": 0, "data": data })
}

module.exports.getTask = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Список задач получен", "errCode": 0, "data": data })
}

module.exports.getTaskById = (req, res) => {
    const data = [];
    const taskId = req.params.taskId;
    res.status(200).json({ "message": `Задача с номером ${taskId} получена`, "errCode": 0, "data": data })
}

module.exports.updateTaskById = (req, res) => {
    const data = [];
    const taskId = req.params.taskId;
    res.status(200).json({ "message": `Задача с номером ${taskId} обновлена`, "errCode": 0, "data": data })
}

module.exports.deleteTaskById = (req, res) => {
    const data = [];
    const taskId = req.params.taskId;
    res.status(200).json({ "message": `Задача с номером ${taskId} удалена`, "errCode": 0, "data": data })
}