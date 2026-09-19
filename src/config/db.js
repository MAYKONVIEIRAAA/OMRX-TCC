const mysql = require("mysql2")
require('dotenv').config();

const conexao = mysql.createConnection({
    host: process.env.host,
    user: process.env.user,
    password: process.env.password,
    database: process.env.database
});

conexao.connect(function (erro) {
    if(erro) throw erro;
    console.log('Success on connection for DB!')
})
