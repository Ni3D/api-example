'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      email: {
        type: Sequelize.STRING,
        unique: true
      },
      passwordHash: {
        type: Sequelize.STRING
      },
      name: {
        type: Sequelize.STRING
      },
      role: {
        type: Sequelize.ENUM('user', 'admin')
      },
      avatarUrl: {
        type: Sequelize.STRING
      },
      isEmailVerified: {
        type: Sequelize.BOOLEAN
      },
      isBlocked: {
        type: Sequelize.BOOLEAN
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('Users');
  }
};