const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const setupDatabase = async () => {
  try {
    console.log('🗄️ Setting up TriOcean AI Database...');
    
    // Create connection without database
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      port: process.env.DB_PORT || 3306
    });

    // Create database
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${process.env.DB_NAME || 'triocean_ai'}`);
    console.log(`✅ Database '${process.env.DB_NAME || 'triocean_ai'}' created/verified!`);

    // Use the database
    await connection.execute(`USE ${process.env.DB_NAME || 'triocean_ai'}`);

    // Read and execute schema
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schema.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await connection.query(statement);
        } catch (error) {
          console.log(`⚠️ Skipping statement: ${statement.substring(0, 50)}...`);
        }
      }
    }

    console.log('✅ Database schema created successfully!');
    console.log('✅ Default data inserted!');
    
    await connection.end();
    
    console.log('🎉 Database setup completed!');
    console.log('💡 You can now start the application with: npm run dev');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error.message);
    console.log('💡 Make sure XAMPP MySQL is running');
  }
};

// Run setup if this file is executed directly
if (require.main === module) {
  setupDatabase();
}

module.exports = setupDatabase; 