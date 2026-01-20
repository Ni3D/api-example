const jwt    = require('jsonwebtoken');
const dotenv = require('dotenv').config();

const accessSecret  = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

class JWTService {
    // Генерация access токена
    static generateAccessToken(userId) {
        return jwt.sign(
            { userId },
            accessSecret,
            { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
        );
    }

    // Генерация refresh токена
    static generateRefreshToken(userId) {
        return jwt.sign(
            { userId },
            refreshSecret,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
        );
    }

    // Верификация access токена
    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, accessSecret);
        } catch (error) {
            console.error('Ошибка при верификации access токена');
            return null;
        }
    }

    // Верификация refresh токена
    static verifyRefreshToken(token) {
        try {
            return jwt.verify(token, refreshSecret);
        } catch (error) {
            console.error('Ошибка при верификации refresh токена');
            return null;
        }
    }

    // Извлечение токена из заголовка
    static extractTokenFromHeader(authHeader) {
        if (!authHeader || typeof authHeader !== 'string') return null;

        const parts = authHeader.trim().split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

        return parts[1];
    }
}

module.exports = JWTService;
