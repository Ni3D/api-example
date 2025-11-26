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
