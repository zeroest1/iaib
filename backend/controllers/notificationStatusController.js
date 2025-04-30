// controllers/notificationStatusController.js
const pool = require('../db');

// Mark notification as read
const markNotificationAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if read status already exists
    const statusCheck = await pool.query(
      'SELECT * FROM notification_read_status WHERE user_id = $1 AND notification_id = $2',
      [req.user.id, id]
    );
    
    if (statusCheck.rows.length > 0) {
      // Update existing read status
      await pool.query(
        'UPDATE notification_read_status SET read = true WHERE user_id = $1 AND notification_id = $2',
        [req.user.id, id]
      );
    } else {
      // Insert new read status
      await pool.query(
        'INSERT INTO notification_read_status (user_id, notification_id, read) VALUES ($1, $2, true)',
        [req.user.id, id]
      );
    }
    
    res.json({ message: 'Notification marked as read' });
  } catch (err) {
    console.error('Error marking notification as read:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get read status for a specific notification with user information
const getNotificationReadStatus = async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if the user is authorized to view this information
    // Only the creator of the notification should see who read it
    const notificationCheck = await pool.query(
      'SELECT created_by FROM notifications WHERE id = $1',
      [id]
    );
    
    if (notificationCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    
    // Check if the user is the creator of the notification
    if (notificationCheck.rows[0].created_by !== req.user.id) {
      return res.status(403).json({ error: 'Access denied. Only the creator can view read status.' });
    }
    
    // Get read status with user information
    const result = await pool.query(`
      SELECT nrs.*, u.name, u.email, u.role 
      FROM notification_read_status nrs
      JOIN users u ON nrs.user_id = u.id
      WHERE nrs.notification_id = $1 AND nrs.read = true
      ORDER BY u.name
    `, [id]);
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting notification read status:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get read status for the current user's notifications
const getUserReadStatus = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notification_read_status WHERE user_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get unread notifications for the current user
const getUnreadNotifications = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT n.* FROM notifications n
      LEFT JOIN notification_read_status r ON n.id = r.notification_id AND r.user_id = $1
      WHERE r.read IS NULL OR r.read = false
      ORDER BY n.created_at DESC
    `, [req.user.id]);
    
    // Note: We're not formatting dates here, as that will be done in the routes
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  markNotificationAsRead,
  getNotificationReadStatus,
  getUserReadStatus,
  getUnreadNotifications
}; 