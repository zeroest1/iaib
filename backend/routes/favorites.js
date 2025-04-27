const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

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

// GET /api/favorites - get all favorites for the logged-in user
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT f.notification_id FROM favorites f WHERE f.user_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/favorites - add a favorite
router.post('/', authenticateToken, async (req, res) => {
  const { notificationId } = req.body;
  if (!notificationId) {
    return res.status(400).json({ error: 'Notification ID required' });
  }
  try {
    await pool.query(
      'INSERT INTO favorites (user_id, notification_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user.id, notificationId]
    );
    res.status(201).json({ message: 'Added to favorites' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/favorites/:notificationId - remove a favorite
router.delete('/:notificationId', authenticateToken, async (req, res) => {
  const { notificationId } = req.params;
  try {
    await pool.query(
      'DELETE FROM favorites WHERE user_id = $1 AND notification_id = $2',
      [req.user.id, notificationId]
    );
    res.json({ message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 