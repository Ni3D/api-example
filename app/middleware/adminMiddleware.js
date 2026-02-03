const { User } = require('../models');

module.exports = async (req, res, next) => {
    try {
        // Проверяем, авторизован ли пользователь
        if (!req.user) {
            return res.status(401).json({
                "message": "Требуется авторизвация",
                "errCode": 1
            });
        }

        // Ищем пользователя в БД
        const user = await User.findByPk(req.user.id);
        if (!user) {
            return res.status(404).json({
                "message": "Пользователь не найден",
                "errCode": 1
            });
        }

        // Проверяем рольпользователя
        if (user.role !== 'admin') {
            return res.status(403).json({
                "message": "Доступ запрещен. Требуются права администратора",
                "errCode": 1
            });
        }

        // Проверяем, не заблокирован ли пользователь
        if (user.isBlocked) {
            return res.status(403).json({
                "message": "Пользователь заблокирован",
                "errCode": 1
            });
        }

        // Добавляем актуальные данные пользователя в запрос
        req.adminUser = user.get({ plain: true });

        next();
        
    } catch (error) {
        console.error('Ошибка при проверке прав администратора:', error);
        res.status(500).json({
            "message": "Ошибка сервера при проверке прав доступа",
            "errCode": 1
        });
    }
}
