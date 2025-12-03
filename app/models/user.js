'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      
      User.hasMany(models.Task, {
        foreignKey: 'assigneeId',
        as: 'AssignedTasks'
      });
      
      User.hasMany(models.Task, {
        foreignKey: 'createdById',
        as: 'CreatedTasks'
      });

      User.hasMany(models.RefreshToken, {
        foreignKey: 'userId'
      });

      User.hasMany(models.EmailVerificationToken, {
        foreignKey: 'userId'
      });

      User.hasMany(models.PasswordResetToken, {
        foreignKey: 'userId'
      });
    }
  }

  User.init({
    email: {
      type: DataTypes.STRING,
      unique: true
    },
    passwordHash: DataTypes.STRING,
    name: DataTypes.STRING,
    role: DataTypes.ENUM('user', 'admin'),
    avatarUrl: DataTypes.STRING,
    isEmailVerified: DataTypes.BOOLEAN,
    isBlocked: DataTypes.BOOLEAN
  }, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'User',
  });
  return User;
};