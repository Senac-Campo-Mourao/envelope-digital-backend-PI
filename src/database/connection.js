const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Se houver um Socket Path (produção no GCP), use-o. 
// Caso contrário, use o Host (desenvolvimento local).
if (process.env.INSTANCE_CONNECTION_NAME) {
  dbConfig.socketPath = `/cloudsql/${process.env.INSTANCE_CONNECTION_NAME}`;
} else {
  dbConfig.host = process.env.DB_HOST;
}

const pool = mysql.createPool(dbConfig);

module.exports = pool;