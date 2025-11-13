import { getPool } from '../config/database.js';

export const createTables = async () => {
  const pool = getPool();
  
  try {
    // Create users table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS IX_users_email ON users (email)
    `);

    // Create accounts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        account_number VARCHAR(50) NOT NULL UNIQUE,
        balance DECIMAL(18,2) NOT NULL DEFAULT 0.00,
        account_type VARCHAR(20) NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS IX_accounts_user_id ON accounts (user_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS IX_accounts_account_number ON accounts (account_number)
    `);

    // Create transactions table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id SERIAL PRIMARY KEY,
        from_account_id INTEGER NULL,
        to_account_id INTEGER NULL,
        amount DECIMAL(18,2) NOT NULL,
        type VARCHAR(20) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'completed',
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        FOREIGN KEY (from_account_id) REFERENCES accounts(id) ON DELETE SET NULL,
        FOREIGN KEY (to_account_id) REFERENCES accounts(id) ON DELETE SET NULL
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS IX_transactions_from_account ON transactions (from_account_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS IX_transactions_to_account ON transactions (to_account_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS IX_transactions_timestamp ON transactions (timestamp)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS IX_transactions_type ON transactions (type)
    `);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

export const dropTables = async () => {
  const pool = getPool();
  
  try {
    await pool.query('DROP TABLE IF EXISTS transactions CASCADE');
    await pool.query('DROP TABLE IF EXISTS accounts CASCADE');
    await pool.query('DROP TABLE IF EXISTS users CASCADE');
    console.log('Database tables dropped successfully');
  } catch (error) {
    console.error('Error dropping tables:', error);
    throw error;
  }
};
