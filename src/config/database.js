const mysql = require('mysql2/promise');
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '', // XAMPP default has no password
  database: process.env.DB_NAME || 'triocean_ai',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ Database connected successfully!');
    connection.release();
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.log('💡 Make sure XAMPP MySQL is running and database exists');
  }
};

// Create database if it doesn't exist
const createDatabase = async () => {
  try {
    const tempPool = mysql.createPool({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
      port: dbConfig.port
    });
    
    await tempPool.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    console.log(`✅ Database '${dbConfig.database}' created/verified!`);
    await tempPool.end();
  } catch (error) {
    console.error('❌ Error creating database:', error.message);
  }
};

module.exports = {
  pool,
  testConnection,
  createDatabase
}; 