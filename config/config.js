
require('dotenv').config();

module.exports = {
  development: {
    username: "root",
    password: process.env.PW ,
    database: "apart",
    host: "127.0.0.1",
    dialect: "mysql"
  },
  test: {
    username:  "root",
    password:  process.env.PW,
    database:  "apart",
    host: "127.0.0.1",
    dialect: "mysql"
  },
  production: {
    username:  "root",
    password: process.env.PW,
    database:  "apart",
    host: "127.0.0.1",
    dialect: "mysql"
  }
};
