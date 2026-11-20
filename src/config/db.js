const mysql = require("mysql2/promise")
require('dotenv').config();

const DEFAULT_DB_PORT = 3306;

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || DEFAULT_DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

module.exports = pool;
