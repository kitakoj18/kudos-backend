const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Teacher = sequelize.define('teacher', {
    id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    firstName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    lastName: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false
    },
    imageUrl: Sequelize.STRING,
    biography: Sequelize.TEXT
});

module.exports = Teacher;