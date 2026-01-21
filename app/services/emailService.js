const nodemailer = require('nodemailer');
const mailFrom = '"Task Manager" <no-reply@taskmanager.com>'

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }

        });
    }

    async sendVerificationEmail(email, name, verificationLink) {
        try {
            const mailOptions = {
                from: mailFrom,
                to: email,
                subject: 'Подтверждение email адреса',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Добро пожаловать!</h2>
                    <p>Здравствуйте, <strong>${name}</strong>!</p>
                    <p>Спасибо за регистрацию. Для завершения регистрации подтвердите ваш email адрес.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${verificationLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;"> Подтвердить Email </a>
                    </div>
                    <p>Или скопируйте ссылку в браузер:</p>
                    <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px;"> ${verificationLink} </p>
                    <p>Ссылка действительна в течение 24 часов.</p>
                    <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #777;">
                    Если вы не регистрировались, проигнорируйте это письмо.
                    </p>
                </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);

            return {
                success: true,
                messageId: info.messageId,
                previewUrl: nodemailer.getTestMessageUrl(info)
            };

        } catch (error) {
            console.error('Ошибка отправки email для подтверждения пользователя', error);
            throw error;
        }
    }

    async sendPasswordResetEmail(email, name, resetLink) {
        try {
            const mailOptions = {
                from: mailFrom,
                to: email,
                subject: 'Запрос на восстановление пароля',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Восстановление пароля</h2>
                    <p>Здравствуйте, <strong>${name}</strong>!</p>
                    <p>Вы запросили восстановление пароля. Для установки нового пароля нажмите на кнопку ниже:</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="${resetLink}" style="background-color: #ff5722; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;"> Восстановить пароль </a>
                    </div>
                    <p>Или скопируйте ссылку в браузер:</p>
                    <p style="word-break: break-all; background-color: #f5f5f5; padding: 10px; border-radius: 5px; font-size: 12px;"> ${resetLink} </p>
                    <p>Ссылка действительна в течение 1 часа.</p>
                    <p style="color: #ff5722; font-weight: bold;">Если вы не запрашивали восстановление пароля, проигнорируйте это письмо.</p>
                </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);

            return {
                success: true,
                messageId: info.messageId,
                previewUrl: nodemailer.getTestMessageUrl(info)
            };
        } catch (error) {
            console.error('Ошибка отправки email для сброса пароля', error);
            throw error;
        }
    }

    async sendPasswordChangeEmail(email, name) {
        try {
            const mailOptions = {
                from: mailFrom,
                to: email,
                subject: 'Изменение пароля',
                html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #333;">Изменение пароля</h2>
                    <p>Здравствуйте, <strong>${name}</strong>!</p>
                    <p>Пароль от Вашей учетной записи был изменен.</p>
                    <p style="color: #ff5722; font-weight: bold;">Если это не Вы, сбросьте пароль через систему восстановелния пароля или обратитесь к администратору!</p>
                </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);

            return {
                success: true,
                messageId: info.messageId,
                previewUrl: nodemailer.getTestMessageUrl(info)
            };
        } catch (error) {
            console.error('Ошибка отправки email для сброса пароля', error);
            throw error;
        }
    }

}

module.exports = new EmailService();
