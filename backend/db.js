// backend/db.js
const { Pool } = require('pg');
require('dotenv').config();

// Set timezone for the database connection
process.env.PGTZ = 'Europe/Tallinn';

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

// Set timezone for all connections
pool.on('connect', (client) => {
  client.query('SET timezone = "Europe/Tallinn"');
  console.log('PostgreSQL timezone set to Europe/Tallinn');
});

// Create tables if they don't exist
const createTables = async () => {
  try {
    await pool.query(`
      -- groups table
      CREATE TABLE IF NOT EXISTS groups (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        is_role_group BOOLEAN DEFAULT false
      );

      -- users table
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        role VARCHAR(20) NOT NULL CHECK (role IN ('tudeng', 'programmijuht')),
        password VARCHAR(255) NOT NULL
      );

      -- user_groups table (many-to-many relationship)
      CREATE TABLE IF NOT EXISTS user_groups (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        group_id INTEGER REFERENCES groups(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, group_id)
      );

      -- notifications table
      CREATE TABLE IF NOT EXISTS notifications (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        content TEXT NOT NULL,
        excerpt TEXT,
        category VARCHAR(50) CHECK (category IN ('õppetöö', 'hindamine', 'praktika', 'stipendium', 'sündmused', 'erakorralised', 'muu')),
        priority VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER REFERENCES users(id)
      );

      -- notification_groups table (many-to-many relationship)
      CREATE TABLE IF NOT EXISTS notification_groups (
        id SERIAL PRIMARY KEY,
        notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
        group_id INTEGER REFERENCES groups(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(notification_id, group_id)
      );

      -- favorites table
      CREATE TABLE IF NOT EXISTS favorites (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        notification_id INTEGER REFERENCES notifications(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, notification_id)
      );

      -- notification_read_status table
      CREATE TABLE IF NOT EXISTS notification_read_status (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        notification_id INTEGER REFERENCES notifications(id),
        read BOOLEAN DEFAULT false,
        UNIQUE(user_id, notification_id)
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
