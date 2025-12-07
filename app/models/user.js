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
      allowNull: false,
      unique: true
    },
    passwordHash: {
      type: DataTypes.STRING,
      allowNull: false
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('user', 'admin'),
      defaultValue: 'user'
    },
    avatarUrl: DataTypes.STRING,
    isEmailVerified: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    isBlocked: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    }
  }, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'User',
  });
  return User;
};