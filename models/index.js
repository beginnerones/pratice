const Sequelize = require('sequelize');
const Apart=require('./apart');
const Zio=require('./zio');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.js')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);
db.sequelize = sequelize;
db.Apart=Apart;
db.Zio=Zio;

Apart.initiate(sequelize);
Zio.initiate(sequelize);

// Apart.associations(db);
// Zio.associations(db);
module.exports = db;
