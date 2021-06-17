const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Transaction = sequelize.define('transaction', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  },
  approved: {
    type: Sequelize.BOOLEAN,
    allowNull: false,
    defaultValue: 0
  },
  prizeName: {
    type: Sequelize.STRING,
    allowNull: false
  },
  prizeImageUrl: {
    type: Sequelize.STRING,
    allowNull: false
  },
  prizeCost: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  studentId: {
    type: Sequelize.INTEGER
  },
  prizeId: {
    type: Sequelize.INTEGER
  },
  classId: {
    type: Sequelize.INTEGER
  }
});

module.exports = Transaction;
