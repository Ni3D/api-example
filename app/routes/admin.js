const express         = require('express');
const adminRouter     = express.Router();
const adminController = require('../controllers/adminController');

// Маршруты ADMIN
adminRouter.get('/user',              adminController.getAllUsers);
adminRouter.get('/user/:userId',      adminController.getUserById);
adminRouter.delete('/user/:userId',   adminController.deleteUser);
adminRouter.get('/task',              adminController.getTask);
adminRouter.get('/task/:taskId',      adminController.getTaskById);
adminRouter.get('/user/:userId/task', adminController.getTaskByUserId);

module.exports = adminRouter;