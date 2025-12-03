module.exports.signupUser = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Регистрация пользователя", "errCode": 0, "data": data })
}

module.exports.signinUser = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Аутентификация пользователя", "errCode": 0, "data": data })
}

module.exports.recoveryRequest = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Запрос восстановления пароля", "errCode": 0, "data": data })
}

module.exports.recoveryReset = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Сброс пароля по токену", "errCode": 0, "data": data })
}

module.exports.verifyEmail = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Подтверждение email по токену", "errCode": 0, "data": data })
}

module.exports.verifyEmailResend = (req, res) => {
    const data = [];
    res.status(200).json({ "message": "Повторная отправка письма подтверждения email", "errCode": 0, "data": data })
}