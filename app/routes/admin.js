const express         = require('express');
const adminRouter     = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware  = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// Применяем middleware для парсинга json
adminRouter.use(express.json());

// Применяем middleware ко всем маршрутам
adminRouter.use(authMiddleware);
adminRouter.use(adminMiddleware);

// Маршруты ADMIN
adminRouter.get('/user',              adminController.getAllUsers);
adminRouter.get('/user/:userId',      adminController.getUserById);
adminRouter.delete('/user/:userId',   adminController.deleteUser);
adminRouter.get('/task',              adminController.getTasksList);
adminRouter.get('/task/:taskId',      adminController.getTaskById);
adminRouter.get('/user/:userId/task', adminController.getTaskByUserId);

module.exports = adminRouter;