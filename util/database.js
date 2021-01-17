const Sequelize = require('sequelize');

const dotenv = require('dotenv').config();

let db_pw;
let db_host;
let db_port;

if(process.env.NODE_ENV === 'production'){
    db_pw = process.env.AWS_DB_PW;
    db_host = process.env.AWS_DB_HOST;
    db_port = parseInt(process.env.AWS_DB_PORT);
} else{
    db_pw = process.env.LOCAL_DB_PW;
    db_host = 'localhost';
    db_port = 3306;
}

// const aws_db_pw = process.env.AWS_DB_PW;
// const aws_db_host = process.env.AWS_DB_HOST;
// const aws_db_port = process.env.AWS_DB_PORT;

const sequelize = new Sequelize('kudos', 'root', db_pw, {
    dialect: 'mysql', 
    host: db_host,
    port: db_port
});

module.exports = sequelize; 