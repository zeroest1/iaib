const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

// GET /api/auth/groups - Get all non-role-based groups for registration
router.get('/groups', async (req, res) => {
  try {
    // Get only regular groups (where is_role_group is false)
    const result = await pool.query('SELECT * FROM groups WHERE is_role_group = false ORDER BY name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching groups for registration:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' });
  }
  try {
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    // Create JWT
    const token = jwt.sign({ id: user.id, role: user.role, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  const { name, email, password, role, groups } = req.body;
  if (!name || !email || !password || !role) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  if (!['tudeng', 'programmijuht'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role' });
  }
  
  try {
    // Start transaction
    await pool.query('BEGIN');
    
    // Check if email already exists
    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length > 0) {
      await pool.query('ROLLBACK');
      return res.status(409).json({ error: 'Email already registered' });
    }
    
    // Hash password
    const hashed = await bcrypt.hash(password, 10);
    
    // Insert user
    const userResult = await pool.query(
      'INSERT INTO users (name, email, role, password) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, email, role, hashed]
    );
    
    const userId = userResult.rows[0].id;
    
    // Add user to role-based group
    const roleGroupId = role === 'tudeng' ? 1 : 2; // 1 for tudeng, 2 for programmijuht
    await pool.query(
      'INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2)',
      [userId, roleGroupId]
    );
    
    // Add user to selected groups if provided
    if (groups && groups.length > 0) {
      // Use a prepared statement with multiple values
      const groupValues = groups.map((groupId, index) => `($1, $${index + 2})`).join(', ');
      const groupParams = [userId, ...groups];
      
      await pool.query(
        `INSERT INTO user_groups (user_id, group_id) VALUES ${groupValues} ON CONFLICT DO NOTHING`,
        groupParams
      );
    }
    
    // Commit transaction
    await pool.query('COMMIT');
    
    res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Middleware to verify JWT
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// GET /api/auth/me
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, role FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 