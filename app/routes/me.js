const express     = require('express');
const meRouter    = express.Router();
const meController = require('../controllers/meController');

// Маршруты ME
meRouter.get('/',   meController.getProfile)
meRouter.patch('/', meController.updateProfile)

module.exports = meRouter;
