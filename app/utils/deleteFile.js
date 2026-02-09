const fs = require('fs').promises;

module.exports.deleteFile = async (filePath) => {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error.code !== 'ENOENT') {
            console.error('Ошибка при удалении файла:', error);
        }
    }
};
