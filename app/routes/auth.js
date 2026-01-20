const express        = require('express');
const authRouter     = express.Router();
const authController = require('../controllers/authController');

// Применяем middleware для парсинга JSON
authRouter.use(express.json());

// Маршруты AUTH
authRouter.post('/signup',           authController.signupUser)
authRouter.post('/signin',           authController.signinUser)
authRouter.post('/signout',          authController.signoutUser)
authRouter.post('/recovery/request', authController.recoveryRequest)
authRouter.post('/recovery/reset',   authController.recoveryReset)
authRouter.get('/verify',            authController.verifyEmail)
authRouter.post('/verify/resend',    authController.verifyEmailResend)

module.exports = authRouter;
