module.exports.getAllUsers = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Список всех пользователей получен", "errCode": 0, "data": data })
}

module.exports.getUserById = (req, res) => {
    const data = [];
    const userId = req.params.userId;
    res.status(200).json({ "message": `Данные пользователя с выбранным Id = ${userId} получены`, "errCode": 0, "data": data })
}

module.exports.deleteUser = (req, res) => {
    const data = [];
    const userId = req.params.userId;
    res.status(200).json({ "message": `Данные пользователя с выбранным Id = ${userId} удалены`, "errCode": 0, "data": data })
}

module.exports.getTask = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Список задач получен", "errCode": 0, "data": data })
}

module.exports.getTaskById = (req, res) => {
    const data = [];
    const taskId = req.params.taskId;
    res.status(200).json({ "message": `Задача с номером ${taskId} получена` , "errCode": 0, "data": data })
}

module.exports.getTaskByUserId = (req, res) => {
    const data = [];
    const userId = req.params.userId;
    res.status(200).json({ "message": `Задачи пользователя с Id = ${userId} получены` , "errCode": 0, "data": data })
}