const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Class = sequelize.define('class', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    className: {
        type: Sequelize.STRING,
        allowNull: false 
    },
    imageUrl: {
        type: Sequelize.STRING,
        allowNull: false
    },
    treasureBoxOpen: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: 0
      }
});

module.exports = Class;