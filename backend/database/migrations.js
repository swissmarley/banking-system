import { getPool } from '../config/database.js';
import {
  encryptAccountNumber,
  hashAccountNumber,
  decryptAccountNumber,
  isEncryptedAccountNumber
} from '../utils/accountNumbers.js';

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
        two_factor_secret TEXT NULL,
        two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        two_factor_verified_at TIMESTAMP NULL,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS IX_users_email ON users (email)
    `);

    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS two_factor_secret TEXT
    `);
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE
    `);
    await pool.query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS two_factor_verified_at TIMESTAMP NULL
    `);

    // Create accounts table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL,
        account_number TEXT NOT NULL,
        account_number_hash VARCHAR(128) UNIQUE,
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

    await pool.query(`
      ALTER TABLE accounts
        ALTER COLUMN account_number TYPE TEXT
    `);
    await pool.query(`
      ALTER TABLE accounts
        ADD COLUMN IF NOT EXISTS account_number_hash VARCHAR(128)
    `);
    await pool.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS IX_accounts_account_number_hash
        ON accounts (account_number_hash)
    `);
    await pool.query(`
      ALTER TABLE accounts
        DROP CONSTRAINT IF EXISTS accounts_account_number_key
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

    await migrateLegacyAccountNumbers(pool);
  } catch (error) {
    console.error('Error creating tables:', error);
    throw error;
  }
};

const migrateLegacyAccountNumbers = async (pool) => {
  const { rows } = await pool.query(
    'SELECT id, account_number, account_number_hash FROM accounts WHERE account_number IS NOT NULL'
  );

  for (const account of rows) {
    const plainAccountNumber = decryptAccountNumber(account.account_number);
    if (!plainAccountNumber) {
      continue;
    }

    const encryptedValue = isEncryptedAccountNumber(account.account_number)
      ? account.account_number
      : encryptAccountNumber(plainAccountNumber);

    const hashedValue = hashAccountNumber(plainAccountNumber);

    if (account.account_number !== encryptedValue || account.account_number_hash !== hashedValue) {
      await pool.query(
        'UPDATE accounts SET account_number = $1, account_number_hash = $2 WHERE id = $3',
        [encryptedValue, hashedValue, account.id]
      );
    }
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
