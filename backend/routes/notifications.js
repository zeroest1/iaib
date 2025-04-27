// routes/notifications.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

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

// Get all notifications with user information
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.*, u.name as creator_name, u.email as creator_email
      FROM notifications n
      LEFT JOIN users u ON n.created_by = u.id
      ORDER BY n.created_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get read status for all notifications for the current user
router.get('/read-status', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT notification_id, read FROM notification_read_status WHERE user_id = $1', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark a notification as read for the current user
router.post('/:id/read', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query(`
      INSERT INTO notification_read_status (user_id, notification_id, read)
      VALUES ($1, $2, true)
      ON CONFLICT (user_id, notification_id) DO UPDATE SET read = true
    `, [req.user.id, id]);
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get unread notifications for the current user
router.get('/unread', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.* FROM notifications n
      LEFT JOIN notification_read_status r ON n.id = r.notification_id AND r.user_id = $1
      WHERE r.read IS NULL OR r.read = false
      ORDER BY n.created_at DESC
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single notification with user information
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT n.*, u.name as creator_name, u.email as creator_email
      FROM notifications n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching notification:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create notification
router.post('/', async (req, res) => {
  try {
    const { title, content, category, priority, createdBy } = req.body;
    
    if (!title || !content || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // First check if the user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [createdBy]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    const result = await pool.query(`
      INSERT INTO notifications (title, content, category, priority, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [title, content, category, priority, createdBy]);
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating notification:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update notification
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, priority } = req.body;
    
    if (!title || !content) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await pool.query(`
      UPDATE notifications
      SET title = $1, content = $2, category = $3, priority = $4
      WHERE id = $5
      RETURNING *
    `, [title, content, category, priority, id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating notification:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // First delete any read status records
    await pool.query('DELETE FROM notification_read_status WHERE notification_id = $1', [id]);
    
    // Then delete the notification
    const result = await pool.query('DELETE FROM notifications WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    console.error('Error deleting notification:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
