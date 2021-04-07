const dotenv = require('dotenv').config();

module.exports = {
    development: {
      username: "root",
      password: process.env.LOCAL_DB_PW,
      database: "kudos",
      host: 'localhost',
      port: 3306,
      dialect: "mysql"
    },
    production: {
      username: "root",
      password: process.env.AWS_DB_PW,
      database: "kudos",
      host: process.env.AWS_DB_HOST,
      port: process.env.AWS_DB_PORT,
      dialect: "mysql"
    }
}
