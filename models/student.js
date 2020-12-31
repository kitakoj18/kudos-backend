const Sequelize = require('sequelize');

const sequelize = require('../util/database');

const Student = sequelize.define('student', {
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
    biography: Sequelize.TEXT,
    favoriteSubject: Sequelize.STRING,
    kudosBalance: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
    }
});

module.exports = Student;