const jwt    = require('jsonwebtoken');
const dotenv = require('dotenv').config();

const accessSecret  = process.env.JWT_ACCESS_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

class JWTService {
    // Генерация access токена
    static generateAccessToken(user) {
        return jwt.sign(
            {
                userId: user.id,
                email: user.email,
                role: user.role
            },
            accessSecret,
            { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
        );
    }

    // Генерация refresh токена
    static generateRefreshToken(user) {
        return jwt.sign(
            {
                userId: user.id
            },
            refreshSecret,
            { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
        );
    }

    // Верификация access токена
    static verifyAccessToken(token) {
        try {
            return jwt.verify(token, accessSecret);
        } catch (error) {
            return null;
        }
    }

    // Верификация refresh токена
    static verifyRefreshToken(token) {
        try {
            return jwt.verify(token, refreshSecret);
        } catch (error) {
            return null;
        }
    }
}

module.exports = JWTService;
