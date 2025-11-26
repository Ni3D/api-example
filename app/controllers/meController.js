module.exports.getProfile = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Данные пользователя получены", "errCode": 0, "data": data })
}

module.exports.updateProfile = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Данные пользователя исправлены", "errCode": 0, "data": data })
}