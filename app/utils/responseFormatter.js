module.exports.formatUserResponse = (user) => ({
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

module.exports.formatTaskResponse = (task) => ({
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
