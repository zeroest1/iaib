// backend/db.js
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'notifications_db',
  password: '2511zeroesT',
  port: 5432
});

// Test the connection
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connecting to the database:', err.stack);
    process.exit(1);
  }
  console.log('Successfully connected to the database');
  release();
});

// Create tables if they don't exist
const createTables = async () => {
  try {
    await pool.query(`
      -- users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100),
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(20) -- "student" or "program_director"
      );

      -- notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        category VARCHAR(50),
        priority VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id)
      );

      -- notification_read_status table
      CREATE TABLE IF NOT EXISTS notification_read_status (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        notification_id INTEGER REFERENCES notifications(id),
        read BOOLEAN DEFAULT false
      );
    `);
    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err.stack);
    process.exit(1);
  }
};

createTables();

module.exports = pool;
