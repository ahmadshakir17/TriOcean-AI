const mysql = require('mysql2/promise');
require('dotenv').config();

const createTables = async () => {
  try {
    console.log('🗄️ Creating database tables...');
    
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'triocean_ai',
      port: process.env.DB_PORT || 3306
    });

    // Create tables one by one
    const tables = [
      `CREATE TABLE IF NOT EXISTS users (
        user_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role ENUM('staff', 'admin') DEFAULT 'staff',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )`,
      
      `CREATE TABLE IF NOT EXISTS ai_models (
        model_id INT AUTO_INCREMENT PRIMARY KEY,
        model_name VARCHAR(100) NOT NULL,
        version VARCHAR(50) NOT NULL,
        active BOOLEAN DEFAULT TRUE
      )`,
      
      `CREATE TABLE IF NOT EXISTS ai_requests (
        request_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        input_type ENUM('text', 'document', 'image') DEFAULT 'text',
        input_content TEXT NOT NULL,
        output_type ENUM('text', 'summary', 'analysis') DEFAULT 'text',
        output_result TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS ai_responses (
        response_id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT NOT NULL,
        response_text TEXT NOT NULL,
        response_time INT,
        token_usage INT,
        latency_ms INT,
        response_rank DECIMAL(3,2),
        FOREIGN KEY (request_id) REFERENCES ai_requests(request_id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS files_uploaded (
        file_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        file_type VARCHAR(50) NOT NULL,
        uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS system_logs (
        log_id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT,
        action_type VARCHAR(100) NOT NULL,
        message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL
      )`,
      
      `CREATE TABLE IF NOT EXISTS feedback (
        feedback_id INT AUTO_INCREMENT PRIMARY KEY,
        request_id INT NOT NULL,
        user_id INT NOT NULL,
        rating INT CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (request_id) REFERENCES ai_requests(request_id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
      )`,
      
      `CREATE TABLE IF NOT EXISTS admin_settings (
        setting_id INT AUTO_INCREMENT PRIMARY KEY,
        setting_name VARCHAR(100) UNIQUE NOT NULL,
        setting_value TEXT,
        updated_by INT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        FOREIGN KEY (updated_by) REFERENCES users(user_id) ON DELETE SET NULL
      )`
    ];

    for (let i = 0; i < tables.length; i++) {
      try {
        await connection.query(tables[i]);
        console.log(`✅ Table ${i + 1} created successfully`);
      } catch (error) {
        console.log(`⚠️ Table ${i + 1} already exists or error: ${error.message}`);
      }
    }

    // Insert default data
    await connection.query(`INSERT IGNORE INTO ai_models (model_name, version, active) VALUES ('GPT-4', 'latest', TRUE)`);
    await connection.query(`INSERT IGNORE INTO admin_settings (setting_name, setting_value) VALUES 
      ('default_model', 'GPT-4'),
      ('max_tokens', '4000'),
      ('temperature', '0.7'),
      ('system_prompt', 'You are TriOcean AI, a helpful internal assistant for company staff.')`);

    console.log('✅ Default data inserted!');
    await connection.end();
    console.log('🎉 Database tables created successfully!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
  }
};

if (require.main === module) {
  createTables();
}

module.exports = createTables; 