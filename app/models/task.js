'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Task extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Task.belongsTo(models.User, { foreignKey: 'assigneeId',
        as: 'Assignee'
       });
      Task.belongsTo(models.User, { foreignKey: 'createdById',
        as: 'Creator'
      });
    }
  }
  Task.init({
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    status: DataTypes.ENUM('NEW', 'IN_PROGRESS', 'DONE', 'ARCHIVED'),
    deadline: DataTypes.DATE,
    assigneeId: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    createdById: {
      type: DataTypes.INTEGER,
      references: {
        model: 'Users',
        key: 'id'
      }
    },
    deletedAt: DataTypes.DATE
  }, {
    sequelize,
    timestamps: true,
    underscored: false,
    modelName: 'Task',
  });
  return Task;
};