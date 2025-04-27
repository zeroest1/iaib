// routes/notifications.js
const express = require('express');
const router = express.Router();
const pool = require('../db');

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
