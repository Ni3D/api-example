const jwt = require('jsonwebtoken');
const { User } = require('../models');

module.exports = async (req, res, next) => {
    try{
        // Получаем данные из заголовка authorization
        const authHeader = req.headers.authorization;
        
        // Проверяем наличие данных в заголовке authorization
        if (!authHeader) {
            return res.status(401).json({
                "message": "Отсутствует токен",
                "errCode": 1
            });
        }

        // Проверяем формат данных в заголовке authorization
        const tokenParts = authHeader.split(' ');
        if (tokenParts.length !== 2 || tokenParts[0] !== 'Bearer') {
            return res.status(401).json({
                "message": "Неверный формат токена",
                "errCode": 1
            });
        }

        // Извлекаем токен
        const token = tokenParts[1];

        // Проверяем, что токен не пустой
        if (!token || token.trim() === '') {
            return res.status(401).json({
                "message": "Токен не может быть пустым",
                "errCode": 1
            });
        }

        // Верифицируем токен
        const decodedToken = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

        // Проверяем что в токене есть userId
        if (!decodedToken || !decodedToken.userId) {
            return res.status(401).json({
                "message": "Неверный формат токена",
                "errCode": 1
            });
        }

        // Находим пользователя в БД по userId
        const user = await User.findByPk(decodedToken.userId, {
            attributes: {
                exclude: ['passwordHash'] // Исключаем пароль
            }
        });

        if (!user) {
            return res.status(404).json({
                "message": "Пользователь не найден",
                "errCode": 1
            });
        }

        // Проверяем, не заблокирован ли пользователь
        if (user.isBlocked) {
            return res.status(403).json({
                "message": "Пользователь заблокирован",
                "errCode": 1,
                data: { isBlocked: true }
            });
        }

        // Преобразуем в JS объект
        const userData = user.get({ plain: true });

        // Добавляем данные пользователя в запрос
        req.user = userData;

        next();

    } catch (error) {
        console.error('Ошибка при верификации токена', error);

        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                "message": "Неверный токен",
                "errCode": 1
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                "message": "Токен истек",
                "errCode": 1
            });
        }

        res.status(500).json({
            "message": "Ошибка сервера при верификации access токена",
            "errCode": 1
        });
    }
}
