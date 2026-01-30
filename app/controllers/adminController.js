const { User, Task } = require('../models');
const { Op }         = require('sequelize');

const ERROR_CODES = {
    BEAR: 1001,     // Ошибка валидации (обязательные поля)
    LION: 2001,     // Неверные учетные данные
    WOLF: 2002,     // Несанкционированный доступ
    SHARK: 3001,    // Пользователь заблокирован
    ELEPHANT: 4001, // Ресурс не найден
    RHINO: 4002,    // Конфликт (дубликат)
    WHALE: 5001,    // Серверная ошибка,
};

// Хелперы
const formatUserResponse = (user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl,
    isEmailVerified: Boolean(user.isEmailVerified),
    isBlocked: Boolean(user.isBlocked),
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
});

const formatTaskResponse = (task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    status: task.status,
    deadline: task.deadline,
    assignee: task.Assignee ? {
        id: task.Assignee.id,
        name: task.Assignee.name,
        email: task.Assignee.email,
        avatarUrl: task.Assignee.avatarUrl || null
    } : null,
    creator: task.Creator ? {
        id: task.Creator.id,
        name: task.Creator.name,
        email: task.Creator.email,
        avatarUrl: task.Creator.avatarUrl || null
    } : null,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    deletedAt: task.deletedAt
});

module.exports.getAllUsers = async (req, res) => {
    try {
        // Получаем параметры запроса
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // Фильтры
        const where = {};

        if (req.query.role) {
            where.role = req.query.role;
        }

        if (req.query.isBlocked !== undefined) {
            where.isBlocked = req.query.isBlocked === 'true';
        }

        if (req.query.isEmailVerified !== undefined) {
            where.isEmailVerified = req.query.isEmailVerified === 'true';
        }

        // Поиск по имени или email
        if (req.query.search) {
            const searchTerm = `%${req.query.search}%`;
            where [Op.or] = [
                { name: { [Op.like]: searchTerm } },
                { email: { [Op.like]: searchTerm } }
            ]
        }

        // Получаем пользователей с пагинацией
        const { count, rows: users  } = await User.findAndCountAll({
            where,
            attributes: { exclude: ['passwordHash'] },
            order: [['id', 'ASC']],
            limit,
            offset
        });

        // Формируем ответ
        const data = users.map(user => formatUserResponse(user));

        // Добавляем информацию о пагинации
        const pagination = {
            page,
            limit,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            hasNextPage: page * limit < count,
            hasPreviousPage: page > 1
        }

        res.status(200).json({
            "message": "Список всех пользователей получен",
            "errCode": 0,
            "data": data,
            "pagination": pagination
        });

    } catch (error) {
        console.error('Ошибка при получении администратором списка пользователей:', error);
        res.status(500).json({
            "message": "Ошибка сервера при получении списка пользователей",
            "errCode": ERROR_CODES.WHALE
        });
    }
}

module.exports.getUserById = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Проверяем, передан ли Id
        if(!userId) {
            return res.status(400).json({
                "message": "Id пользователя обязателен",
                "errCode": ERROR_CODES.BEAR
            });
        }

        // Проверяем, что переданный Id является числом
        const userIdNum = parseInt(userId);
        if (isNaN(userIdNum)) {
            return res.status(400).json({
                "message": "Id пользователя должен быть числом",
                "errCode": ERROR_CODES.BEAR
            });
        }

        //Ищем пользователя в БД
        const user = await User.findByPk(userIdNum, {
            attributes: { exclude: ['passwordHash'] }
        });

        if (!user) {
            return res.status(404).json({
                "message": `Пользователь с Id ${userId} не найден`,
                "errCode": ERROR_CODES.ELEPHANT
            });
        }

        // Формируем ответ
        const data = formatUserResponse(user);

        res.status(200).json({
            "message": `Данные пользователя с Id ${userId} получены`,
            "errCode": 0,
            "data": data
        });

    } catch (error) {
        console.error('Ошибка сервера при получении администратором пользователя по Id:', error);
        res.status(500).json({
            "message": "Ошибка сервера при получении пользователя",
            "errCode": ERROR_CODES.WHALE
        });
    }
}

module.exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Проверяем, передан ли Id
        if (!userId) {
            return res.status(400).json({
                "message": "Id пользователя оябзателен",
                "errCode": ERROR_CODES.BEAR
            });
        }

        // Проверяем, что Id является числом
        const userIdNum = parseInt(userId);

        if (isNaN(userIdNum)) {
            return res.status(400).json({
                "message": "Id должен быть числом",
                "errCode": ERROR_CODES.BEAR
            });
        }

        // Запрещаем удалять самого себя
        if (userIdNum === req.user.id) {
            return res.status(400).json({
                "message": "Нельзя удалить свой собственный аккаунт через панель администратора",
                "errCode": ERROR_CODES.BEAR
            });
        }

        // Ищем пользователя в БД
        const user = await User.findByPk(userIdNum);

        if (!user) {
            return res.status(404).json({
                "message": `Пользователь с Id ${userId} не найден`,
                "errCode": ERROR_CODES.ELEPHANT
            });
        }

        // Сохраняем данные пользователя для ответа
        const data = formatUserResponse(user);

        // Удаляем пользователя
        await user.destroy();

        res.status(200).json({
            "message": `Пользователь с Id ${userId} удален`,
            "errCode": 0,
            "data": data
        });

    } catch (error) {
        console.error('Ошибка сервера при удалении администратором пользователя:', error);
        return res.status(500).json({
            "message": "Ошибка сервера при удалении пользователя",
            "errCode": ERROR_CODES.WHALE
        });
    }
}

module.exports.getTasksList = async (req, res) => {
    try {
        // Получаем параметры запроса
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        // Фильтры
        const where = { deletedAt: null };

        if (req.query.status) {
            where.status = req.query.status;
        }

        if (req.query.assigneeId) {
            where.assigneeId = parseInt(req.query.assigneeId);
        }

        if (req.query.createdById) {
            where.createdById = parseInt(req.query.createdById);
        }

        // Поиск по названию или описанию
        if (req.query.search) {
            const searchTerm = `%${req.query.search}%`;
            where[Op.or] = [
                { title: { [Op.like]: searchTerm } },
                { description: { [Op.like]: searchTerm } }
            ];
        }

        // Фильтр по дедлайну
        if (req.query.deadlineFrom) {
            where.deadline = where.deadline || {};
            where.deadline[Op.gte] = new Date(req.query.deadlineFrom);
        }

        if (req.query.deadlineTo) {
            where.deadline = where.deadline || {};
            where.deadline[Op.lte] = new Date(req.query.deadlineTo);
        }

        // Получаем задачи с пагинацией
        const { count, rows: tasks } = await Task.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: 'Assignee',
                    attributes: ['id', 'name', 'email', 'avatarUrl']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });

        // формируем ответ
        const data = tasks.map(task => formatTaskResponse(task));

        // Добавляем информацию о пагинации
        const pagination = {
            page,
            limit,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            hasNextPage: page * limit < count,
            hasPreviousPage: page > 1
        };

        res.status(200).json({
            "message": "Список задач получен",
            "errCode": 0,
            "data": data,
            "pagination": pagination
        });

    } catch (error) {
        console.error('Ошибка при получении администратором списка всех задач:', error);
        res.status(500).json({
            "message": "Ошибка сервера при получении списка задач",
            "errCode": ERROR_CODES.WHALE
        });
    }
}

module.exports.getTaskById = async (req, res) => {
    try {
        const taskId = req.params.taskId;

        // Проверяем, передан ли taskId
        if (!taskId) {
            return res.status(400).json({
                "message": "Id задачи обязателен",
                "errCode": ERROR_CODES.BEAR
            });
        }

        // Проверяем, что taskId является числом
        const taskIdNum = parseInt(taskId);

        if (isNaN(taskIdNum)) {
            return res.status(400).json({
                "message": "Id задачи должен быть числом",
                "errCode": ERROR_CODES.BEAR
            });
        }

        // Ищем задачу в БД
        const task = await Task.findByPk(taskIdNum, {
            include: [
                {
                    model: User,
                    as: 'Assignee',
                    attributes: ['id', 'name', 'email', 'avatarUrl']
                },
                {
                    model: User,
                    as: 'Creator',
                    attributes: ['id', 'name', 'email', 'avatarUrl']
                }
            ]
        });

        if (!task) {
            return res.status(404).json({
                "message": `Задача с Id ${taskId} не найдена`,
                "errCode": ERROR_CODES.ELEPHANT
            });
        }

        // Формируем ответ
        const data = formatTaskResponse(task);

        res.status(200).json({
            "message": `Задача с Id ${taskId} получена`,
            "errCode": 0,
            "data": data
        });

    } catch (error) {
        console.error('Ошибка при получении администратором задачи по Id:', error);
        res.status(500).json({
            "message": "Ошибка сервера при получении задачи",
            "errCode": ERROR_CODES.WHALE
        });
    }
}

module.exports.getTaskByUserId = async (req, res) => {
    try {
        const userId = req.params.userId;

        // Проверям, передан ли Id пользователя
        if (!userId) {
            return res.status(400).json({
                "message": "Id пользователя обязателен",
                "errCode": ERROR_CODES.BEAR
            });
        }

        // Проверяем, что id пользователя является числом
        const userIdNum = parseInt(userId);

        if (isNaN(userIdNum)) {
            return res.status(400).json({
                "message": "Id пользователя должен быть числом",
                "errCode": ERROR_CODES.BEAR
            });
        }

        // Ищем пользователя в БД
        const user = await User.findByPk(userIdNum, {
            attributes: { exclude: ['passwordHash'] }
        });

        if (!user) {
            return res.status(404).json({
                "message": `Пользователь с Id ${userId} не найден`,
                "errCode": ERROR_CODES.ELEPHANT
            });
        }

        // Получаем параметры запроса
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;
        const taskType = req.query.type || 'all';

        // Фильтры
        const where = { deletedAt: null };

        if (taskType === 'assigned') {
            where.assigneeId = userIdNum;
        } else if (taskType === 'created') {
            where.createdById = userIdNum;
        } else {
            where[Op.or] = [
                { assigneeId: userIdNum },
                { createdById: userIdNum }
            ];
        }

        if (req.query.status) {
            where.status = req.query.status;
        }

        // Получаем задачи
        const { count, rows: tasks } = await Task.findAndCountAll({
            where,
            include: [
                {
                    model: User,
                    as: 'Assignee',
                    attributes: ['id', 'name', 'email', 'avatarUrl']
                },
                {
                    model: User,
                    as: 'Creator',
                    attributes: ['id', 'name', 'email', 'avatarUrl']
                }
            ],
            order: [['createdAt', 'DESC']],
            limit,
            offset
        });
        
        // Формируем ответ
        const data = tasks.map(task => formatTaskResponse(task));

        const assignedTasksCount = await Task.count({
            where: {
                assigneeId: userIdNum,
                deletedAt: null
            }
        });

        const createdTasksCount = await Task.count({
            where: {
                createdById: userIdNum,
                deletedAt: null
            }
        });

        // Добавляем информацию о пагинации
        const pagination = {
            page,
            limit,
            totalItems: count,
            totalPages: Math.ceil(count / limit),
            hasNextPage: page * limit < count,
            hasPreviousPage: page > 1
        };

        // Добавляем информацию о пользователе и статистику
        const userInfo = {
            id: user.id,
            name: user.name,
            email: user.email,
            taskStats: {
                assignedTasksCount,
                createdTasksCount,
                totalTasksCount: assignedTasksCount + createdTasksCount
            }
        }

        res.status(200).json({
            "message": `Задачи пользователя с Id ${userId} получены`,
            "errCode": 0,
            "data": {
                user: userInfo,
                tasks: data,
                pagination: pagination
            }
        });

    } catch (error) {
        console.error('Ошибка при получении администратором задач пользователя по его id:', error);
        res.status(500).json({
            "message": "Ошибка сервера при получении задач пользователя",
            "errCode": ERROR_CODES.WHALE
        });
    }
}