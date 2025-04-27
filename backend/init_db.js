const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'notifications_db',
  password: '2511zeroesT',
  port: 5432
});

async function initDatabase() {
  try {
    // Read the SQL file
    const sql = fs.readFileSync(path.join(__dirname, 'init_db.sql'), 'utf8');
    
    // Execute the SQL commands
    await pool.query(sql);
    
    console.log('Database initialized successfully!');
    console.log('Created two users:');
    console.log('1. Student: opilane@example.com');
    console.log('2. Programmijuht: programmijuht@example.com');
  } catch (err) {
    console.error('Error initializing database:', err);
  } finally {
    await pool.end();
  }
}

initDatabase(); 