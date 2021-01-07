const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Wish = sequelize.define('wish', {
  id: {
    type: Sequelize.INTEGER,
    autoIncrement: true,
    allowNull: false,
    primaryKey: true
  }
});

module.exports = Wish;