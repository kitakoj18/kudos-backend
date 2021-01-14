const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Prize = sequelize.define('prize', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false
    },
    imageUrl: {
        type: Sequelize.STRING,
        allowNull: false
    },
    description: Sequelize.TEXT,
    category: Sequelize.TEXT,
    kudosCost: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1
    }
});

module.exports = Prize;