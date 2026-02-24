'use strict';
const bcrypt = require('bcrypt');
require('dotenv').config();

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(process.env.ADMIN_PASSWORD, saltRounds);

    await queryInterface.bulkInsert('Users', [{
      email: process.env.ADMIN_EMAIL,
      passwordHash: passwordHash,
      name: process.env.ADMIN_NAME,
      role: 'admin',
      avatarUrl: null,
      isEmailVerified: true,
      isBlocked: false,
      createdAt: new Date(),
      updatedAt: new Date()
    }]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', {
      email: process.env.ADMIN_EMAIL
    });
  }
};
