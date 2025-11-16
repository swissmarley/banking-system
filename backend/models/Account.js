import { getPool } from '../config/database.js';

export class Account {
  static async create(userId, accountType) {
    const pool = getPool();
    const accountNumber = this.generateAccountNumber();
    const iban = this.generateIban(accountNumber);
    
    const result = await pool.query(
      `INSERT INTO accounts (user_id, account_number, iban, balance, account_type, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       RETURNING id, user_id, account_number, iban, balance, account_type, created_at`,
      [userId, accountNumber, iban, 0.00, accountType]
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

  static async findByIban(iban) {
    if (!iban) {
      return null;
    }

    const pool = getPool();
    const result = await pool.query(
      'SELECT * FROM accounts WHERE UPPER(REPLACE(iban, \' \', \'\')) = UPPER(REPLACE($1, \' \', \'\'))',
      [iban]
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

  static generateIban(accountNumber) {
    const countryCode = (process.env.IBAN_COUNTRY_CODE || 'DE').toUpperCase().slice(0, 2);
    const bankCode = (process.env.IBAN_BANK_CODE || '10020000').replace(/\D/g, '').padStart(8, '0').slice(0, 8);
    const numericAccount = accountNumber.replace(/\D/g, '').padStart(10, '0').slice(-10);
    const checkSeed = `${bankCode}${numericAccount}${countryCode}00`;

    const expanded = checkSeed
      .toUpperCase()
      .split('')
      .map((char) => {
        const code = char.charCodeAt(0);
        if (code >= 65 && code <= 90) {
          return String(code - 55);
        }
        return char;
      })
      .join('');

    let remainder = 0n;
    for (const digit of expanded) {
      remainder = (remainder * 10n + BigInt(digit)) % 97n;
    }

    const checkDigits = (98n - remainder).toString().padStart(2, '0');
    return `${countryCode}${checkDigits}${bankCode}${numericAccount}`;
  }
}
