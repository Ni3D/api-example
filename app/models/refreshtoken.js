'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RefreshToken extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      RefreshToken.belongsTo(models.User, {
        foreignKey: 'userId'
      });
    }
  }
  
  RefreshToken.init({
    userId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    token: DataTypes.STRING,
    expiresAt: DataTypes.DATE,
    isRevoked: DataTypes.BOOLEAN
  }, {
    sequelize,
    timestamps: true,
    modelName: 'RefreshToken',
  });
  return RefreshToken;
};