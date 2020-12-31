const Sequelize = require('sequelize');

const dotenv = require('dotenv').config();
const aws_db_pw = process.env.AWS_DB_PW;
const aws_db_host = process.env.AWS_DB_HOST;
const aws_db_port = process.env.AWS_DB_PORT;

const sequelize = new Sequelize('kudos', 'root', aws_db_pw, {
    dialect: 'mysql', 
    host: aws_db_host,
    port: parseInt(aws_db_port)
});

module.exports = sequelize; 