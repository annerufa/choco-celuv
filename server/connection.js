// const mysql = require('mysql2')
const mysql = require('mysql2/promise');

const db = mysql.createPool({
    host: "localhost",
    user: "root",
    password: "",
    database: "celuv_4",
    waitForConnections: true,
    connectionLimit: 10,
})

module.exports = db