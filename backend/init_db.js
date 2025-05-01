const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Create pool using either DATABASE_URL or individual connection parameters
let pool;
if (process.env.DATABASE_URL) {
  // Use connection string if provided
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });
  console.log('Using DATABASE_URL for PostgreSQL connection in init_db.js');
} else {
  // Fall back to individual parameters if DATABASE_URL is not provided
  pool = new Pool({
    user: process.env.DB_USER || 'postgres',
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'notifications_db',
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT || 5432
  });
  console.log('Using individual connection parameters for PostgreSQL in init_db.js');
}

async function initDatabase() {
  try {
    // Read the SQL file
    const sql = fs.readFileSync(path.join(__dirname, 'init_db.sql'), 'utf8');
    
    // Execute the SQL commands
    await pool.query(sql);
    
    console.log('Database initialized successfully!');
    console.log('Created two users:');
    console.log('1. Tudeng: opilane@example.com');
    console.log('2. Programmijuht: programmijuht@example.com');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    await pool.end();
  }
}

initDatabase(); 