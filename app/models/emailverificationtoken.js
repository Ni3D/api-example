'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class EmailVerificationToken extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      EmailVerificationToken.belongsTo(models.User, {
        foreignKey: 'userId'
      });
    }
  }
  EmailVerificationToken.init({
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    token: {
      type: DataTypes.STRING,
      unique: true
    },
    expiresAt: DataTypes.DATE,
    usedAt: DataTypes.DATE
  }, {
    sequelize,
    timestamps: true,
    modelName: 'EmailVerificationToken',
  });
  return EmailVerificationToken;
};