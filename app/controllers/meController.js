const { User } = require('../models');

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

module.exports.updateProfile = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Данные пользователя исправлены", "errCode": 0, "data": data })
}

module.exports.deleteProfile = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Данные пользователя удалены", "errCode": 0, "data": data })
}

module.exports.uploadAvatar = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Аватар пользователя загружен", "errCode": 0, "data": data })
}

module.exports.deleteAvatar = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Аватар пользователя удален", "errCode": 0, "data": data })
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