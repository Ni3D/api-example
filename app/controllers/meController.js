module.exports.getProfile = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Данные пользователя получены", "errCode": 0, "data": data })
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