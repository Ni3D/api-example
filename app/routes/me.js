const express        = require('express');
const meRouter       = express.Router();
const meController   = require('../controllers/meController');
const authMiddleware = require('../middleware/authMiddleware');

// Применяем middleware для парсинга JSON
meRouter.use(express.json());

// Применяем authMiddleware ко всем маршрутам me
meRouter.use(authMiddleware);

// Маршруты ME
meRouter.get('/',                meController.getProfile)
meRouter.patch('/',              meController.updateProfile)
meRouter.delete('/',             meController.deleteProfile)
meRouter.post('/upload',         meController.uploadAvatar)
meRouter.delete('/upload',       meController.deleteAvatar)
meRouter.post('/task',           meController.createTask)
meRouter.get('/task',            meController.getTask)
meRouter.get('/task/:taskId',    meController.getTaskById)
meRouter.patch('/task/:taskId',  meController.updateTaskById)
meRouter.delete('/task/:taskId', meController.deleteTaskById)

module.exports = meRouter;