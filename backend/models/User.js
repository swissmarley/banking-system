import { getPool } from '../config/database.js';
import bcrypt from 'bcryptjs';

export class User {
  static async create(username, email, password) {
    const pool = getPool();
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, created_at)
       VALUES ($1, $2, $3, NOW())
       RETURNING id, username, email, created_at`,
      [username, email, hashedPassword]
    );
    
    return result.rows[0];
  }

  static async findByEmail(email) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    return result.rows[0];
  }

  static async findById(id) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, username, email, created_at FROM users WHERE id = $1',
      [id]
    );
    
    return result.rows[0];
  }

  static async findAll(limit = 100, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT id, username, email, created_at FROM users ORDER BY id LIMIT $1 OFFSET $2',
      [limit, offset]
    );
    return result.rows;
  }

  static async count() {
    const pool = getPool();
    const result = await pool.query('SELECT COUNT(*) as total FROM users');
    return parseInt(result.rows[0].total);
  }

  static async verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }
}
