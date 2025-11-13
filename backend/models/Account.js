import { getPool } from '../config/database.js';

export class Account {
  static async create(userId, accountType) {
    const pool = getPool();
    const accountNumber = this.generateAccountNumber();
    
    const result = await pool.query(
      `INSERT INTO accounts (user_id, account_number, balance, account_type, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING id, user_id, account_number, balance, account_type, created_at`,
      [userId, accountNumber, 0.00, accountType]
    );
    
    return result.rows[0];
  }

  static async findByUserId(userId) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM accounts WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    
    return result.rows;
  }

  static async findById(id) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM accounts WHERE id = $1',
      [id]
    );
    
    return result.rows[0];
  }

  static async findByAccountNumber(accountNumber) {
    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM accounts WHERE account_number = $1',
      [accountNumber]
    );
    
    return result.rows[0];
  }

  static async updateBalance(accountId, newBalance) {
    const pool = getPool();
    const result = await pool.query(
      'UPDATE accounts SET balance = $1 WHERE id = $2',
      [newBalance, accountId]
    );
    
    return result.rowCount > 0;
  }

  static async delete(id) {
    const pool = getPool();
    const result = await pool.query(
      'DELETE FROM accounts WHERE id = $1',
      [id]
    );
    
    return result.rowCount > 0;
  }

  static async findAll(limit = 100, offset = 0) {
    const pool = getPool();
    const result = await pool.query(
      `SELECT a.*, u.username, u.email 
       FROM accounts a 
       JOIN users u ON a.user_id = u.id 
       ORDER BY a.id 
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    return result.rows;
  }

  static async count() {
    const pool = getPool();
    const result = await pool.query('SELECT COUNT(*) as total FROM accounts');
    return parseInt(result.rows[0].total);
  }

  static generateAccountNumber() {
    return 'ACC' + Date.now().toString() + Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  }
}
