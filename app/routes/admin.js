const express     = require('express');
const adminRouter = express.Router();
const adminController = require('../controllers/adminController');

// Маршруты ADMIN
adminRouter.get('/user',            adminController.getAllUsers);
adminRouter.get('/user/:userId',    adminController.getUserById);
adminRouter.delete('/user/:userId', adminController.deleteUser);

module.exports = adminRouter;
