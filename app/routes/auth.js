const express     = require('express');
const authRouter  = express.Router();
const authController = require('../controllers/authController');

// Маршруты AUTH
authRouter.post('/signup', authController.signupUser)
authRouter.post('/signin', authController.signinUser)

module.exports = authRouter;
