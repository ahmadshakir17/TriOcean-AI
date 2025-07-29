const { pool } = require('../config/database');

class AIRequest {
  static async create(requestData) {
    const { user_id, input_type, input_content, output_type } = requestData;
    
    const query = `
      INSERT INTO ai_requests (user_id, input_type, input_content, output_type, created_at) 
      VALUES (?, ?, ?, ?, NOW())
    `;
    
    try {
      const [result] = await pool.execute(query, [user_id, input_type, input_content, output_type]);
      return result.insertId;
    } catch (error) {
      throw new Error(`Error creating AI request: ${error.message}`);
    }
  }

  static async findById(requestId) {
    const query = `
      SELECT ar.*, u.name as user_name 
      FROM ai_requests ar 
      JOIN users u ON ar.user_id = u.user_id 
      WHERE ar.request_id = ?
    `;
    
    try {
      const [rows] = await pool.execute(query, [requestId]);
      return rows[0];
    } catch (error) {
      throw new Error(`Error finding AI request: ${error.message}`);
    }
  }

  static async findByUserId(userId, limit = 50) {
    const query = `
      SELECT ar.*, u.name as user_name 
      FROM ai_requests ar 
      JOIN users u ON ar.user_id = u.user_id 
      WHERE ar.user_id = ? 
      ORDER BY ar.created_at DESC 
      LIMIT ?
    `;
    
    try {
      const [rows] = await pool.execute(query, [userId, limit]);
      return rows;
    } catch (error) {
      throw new Error(`Error finding AI requests: ${error.message}`);
    }
  }

  static async updateOutput(requestId, outputResult) {
    const query = 'UPDATE ai_requests SET output_result = ? WHERE request_id = ?';
    
    try {
      const [result] = await pool.execute(query, [outputResult, requestId]);
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error updating AI request: ${error.message}`);
    }
  }

  static async getAllRequests(limit = 100) {
    const query = `
      SELECT ar.*, u.name as user_name 
      FROM ai_requests ar 
      JOIN users u ON ar.user_id = u.user_id 
      ORDER BY ar.created_at DESC 
      LIMIT ?
    `;
    
    try {
      const [rows] = await pool.execute(query, [limit]);
      return rows;
    } catch (error) {
      throw new Error(`Error getting all AI requests: ${error.message}`);
    }
  }

  static async getStats() {
    const query = `
      SELECT 
        COUNT(*) as total_requests,
        COUNT(DISTINCT user_id) as unique_users,
        DATE(created_at) as date,
        COUNT(*) as daily_requests
      FROM ai_requests 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    try {
      const [rows] = await pool.execute(query);
      return rows;
    } catch (error) {
      throw new Error(`Error getting AI request stats: ${error.message}`);
    }
  }
}

module.exports = AIRequest; 