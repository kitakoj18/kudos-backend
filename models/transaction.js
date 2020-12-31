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
  // prizeId: {
  //   type: Sequelize.INTEGER,
  //   allowNull: false
  // }
});

module.exports = Transaction;
