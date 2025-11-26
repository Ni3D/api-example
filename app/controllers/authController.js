
module.exports.signupUser = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Регистрация пользователя", "errCode": 0, "data": data })
}

module.exports.signinUser = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Аутентификация пользователя", "errCode": 0, "data": data })
}