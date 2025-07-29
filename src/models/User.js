const { pool } = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  static async create(userData) {
    const { name, email, password, role = 'staff' } = userData;
    const passwordHash = await bcrypt.hash(password, 10);
    
    const query = `
      INSERT INTO users (name, email, password_hash, role, created_at) 
      VALUES (?, ?, ?, ?, NOW())
    `;
    
    try {
      const [result] = await pool.execute(query, [name, email, passwordHash, role]);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }
  }

  static async findByEmail(email) {
    const query = 'SELECT * FROM users WHERE email = ?';
    
    try {
      const [rows] = await pool.execute(query, [email]);
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  static async findById(userId) {
    const query = 'SELECT * FROM users WHERE user_id = ?';
    
    try {
      const [rows] = await pool.execute(query, [userId]);
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding user: ${error.message}`);
    }
  }

  static async updateProfile(userId, userData) {
    const { name, email } = userData;
    const query = 'UPDATE users SET name = ?, email = ? WHERE user_id = ?';
    
    try {
      const [result] = await pool.execute(query, [name, email, userId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating user: ${error.message}`);
    }
  }

  static async getAllUsers() {
    const query = 'SELECT user_id, name, email, role, created_at FROM users ORDER BY created_at DESC';
    
    try {
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      throw new Error(`Error getting users: ${error.message}`);
    }
  }

  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
}

module.exports = User; 