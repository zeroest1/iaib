// routes/notifications.js
const express = require('express');
const router = express.Router();
const pool = require('../db');
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

// Helper function to format notification timestamps to ISO format in the correct timezone
const formatNotificationDates = (data) => {
  // Handle array of notifications
  if (Array.isArray(data)) {
    return data.map(notification => {
      if (notification.created_at) {
        notification.created_at = new Date(notification.created_at).toISOString();
      }
      return notification;
    });
  }
  
  // Handle single notification
  if (data && data.created_at) {
    data.created_at = new Date(data.created_at).toISOString();
  }
  return data;
};

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check if user is a programmijuht
const checkProgramManager = (req, res, next) => {
  if (req.user.role !== 'programmijuht') {
    return res.status(403).json({ error: 'Access denied. Programmijuht only.' });
  }
  next();
};

// Search notifications
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    // Check if user is programmijuht
    const isProgramManager = req.user.role === 'programmijuht';
    
    // First get the user's groups - needed for both roles
    const userGroupResult = await pool.query(`
      SELECT group_id FROM user_groups WHERE user_id = $1
    `, [req.user.id]);
    
    const userGroupIds = userGroupResult.rows.map(row => row.group_id);
    
    let result;
    
    if (isProgramManager) {
      // Program managers can search in:
      // 1. Their own created notifications
      // 2. Public notifications (no group targeting)
      // 3. Notifications targeted to their groups
      result = await pool.query(`
        SELECT DISTINCT n.*, u.name as creator_name, u.email as creator_email
        FROM notifications n
        LEFT JOIN users u ON n.created_by = u.id
        WHERE (
          n.created_by = $1
          OR NOT EXISTS (
            SELECT 1 FROM notification_groups 
            WHERE notification_id = n.id
          )
          OR EXISTS (
            SELECT 1 FROM notification_groups 
            WHERE notification_id = n.id 
            AND group_id = ANY($2::int[])
          )
        )
        AND (
          n.title ILIKE $3
          OR n.content ILIKE $3
          OR u.name ILIKE $3
          OR n.category ILIKE $3
        )
        ORDER BY n.created_at DESC
      `, [req.user.id, userGroupIds.length > 0 ? userGroupIds : [null], `%${query}%`]);
    } else {
      // Regular users can search in:
      // 1. Notifications targeted to their groups
      // 2. Public notifications (no group targeting)
      if (userGroupIds.length === 0) {
        // If user has no groups, only search in public notifications
        result = await pool.query(`
          SELECT DISTINCT n.*, u.name as creator_name, u.email as creator_email
          FROM notifications n
          LEFT JOIN users u ON n.created_by = u.id
          WHERE NOT EXISTS (
            SELECT 1 FROM notification_groups 
            WHERE notification_id = n.id
          )
          AND (
            n.title ILIKE $1
            OR n.content ILIKE $1
            OR u.name ILIKE $1
            OR n.category ILIKE $1
          )
          ORDER BY n.created_at DESC
        `, [`%${query}%`]);
      } else {
        // Otherwise search in user's groups and public notifications
        result = await pool.query(`
          SELECT DISTINCT n.*, u.name as creator_name, u.email as creator_email
          FROM notifications n
          LEFT JOIN users u ON n.created_by = u.id
          WHERE (
            EXISTS (
              SELECT 1 FROM notification_groups 
              WHERE notification_id = n.id 
              AND group_id = ANY($1::int[])
            )
            OR NOT EXISTS (
              SELECT 1 FROM notification_groups 
              WHERE notification_id = n.id
            )
          )
          AND (
            n.title ILIKE $2
            OR n.content ILIKE $2
            OR u.name ILIKE $2
            OR n.category ILIKE $2
          )
          ORDER BY n.created_at DESC
        `, [userGroupIds, `%${query}%`]);
      }
    }
    
    // Format dates before sending
    const formattedNotifications = formatNotificationDates(result.rows);
    return res.json(formattedNotifications);
  } catch (err) {
    console.error('Error searching notifications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all notifications with user information, filtered by user's groups
router.get('/', authenticateToken, async (req, res) => {
  try {
    // Check if user is programmijuht
    const isProgramManager = req.user.role === 'programmijuht';
    
    // First get the user's groups - needed for both roles
    const userGroupResult = await pool.query(`
      SELECT group_id FROM user_groups WHERE user_id = $1
    `, [req.user.id]);
    
    const userGroupIds = userGroupResult.rows.map(row => row.group_id);
    
    if (isProgramManager) {
      // Program managers can see:
      // 1. Their own created notifications
      // 2. Public notifications (no group targeting)
      // 3. Notifications targeted to their groups
      const result = await pool.query(`
        SELECT DISTINCT n.*, u.name as creator_name, u.email as creator_email
        FROM notifications n
        LEFT JOIN users u ON n.created_by = u.id
        WHERE n.created_by = $1
           OR NOT EXISTS (
              SELECT 1 FROM notification_groups 
              WHERE notification_id = n.id
           )
           OR EXISTS (
              SELECT 1 FROM notification_groups 
              WHERE notification_id = n.id 
              AND group_id = ANY($2::int[])
           )
        ORDER BY n.created_at DESC
      `, [req.user.id, userGroupIds.length > 0 ? userGroupIds : [null]]);
      
      // Format dates before sending
      const formattedNotifications = formatNotificationDates(result.rows);
      return res.json(formattedNotifications);
    } else {
      // Get user's groups
      const userGroupResult = await pool.query(`
        SELECT group_id FROM user_groups WHERE user_id = $1
      `, [req.user.id]);
      
      const userGroupIds = userGroupResult.rows.map(row => row.group_id);
      
      if (userGroupIds.length === 0) {
        // If user has no groups, only show public notifications
        const result = await pool.query(`
          SELECT DISTINCT n.*, u.name as creator_name, u.email as creator_email
          FROM notifications n
          LEFT JOIN users u ON n.created_by = u.id
          WHERE NOT EXISTS (
            SELECT 1 FROM notification_groups 
            WHERE notification_id = n.id
          )
          ORDER BY n.created_at DESC
        `);
        
        // Format dates before sending
        const formattedNotifications = formatNotificationDates(result.rows);
        return res.json(formattedNotifications);
      }
      
      // Tudeng sees notifications targeted to any of their groups + notifications without any group targeting
      const result = await pool.query(`
        SELECT DISTINCT n.*, u.name as creator_name, u.email as creator_email
        FROM notifications n
        LEFT JOIN users u ON n.created_by = u.id
        WHERE (
          -- Notifications targeted to any of user's groups
          EXISTS (
            SELECT 1 FROM notification_groups 
            WHERE notification_id = n.id 
            AND group_id = ANY($1::int[])
          )
          -- OR notifications without any group targeting
          OR NOT EXISTS (
            SELECT 1 FROM notification_groups 
            WHERE notification_id = n.id
          )
        )
        ORDER BY n.created_at DESC
      `, [userGroupIds]);
      
      // Format dates before sending
      const formattedNotifications = formatNotificationDates(result.rows);
      return res.json(formattedNotifications);
    }
  } catch (err) {
    console.error('Error fetching notifications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get all available groups
router.get('/groups', authenticateToken, async (req, res) => {
  try {
    // Include role-based groups too, show all groups for selection
    const result = await pool.query('SELECT * FROM groups ORDER BY is_role_group DESC, name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching groups:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get notification target groups
router.get('/:id/groups', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(`
      SELECT g.* 
      FROM groups g
      JOIN notification_groups ng ON g.id = ng.group_id
      WHERE ng.notification_id = $1
    `, [id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching notification groups:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user's groups
router.get('/user-groups', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT g.* 
      FROM groups g
      JOIN user_groups ug ON g.id = ug.group_id
      WHERE ug.user_id = $1
      ORDER BY g.is_role_group DESC, g.name
    `, [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching user groups:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Simpler version for debugging - get notifications created by the current user (without role check)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    console.log('Fetching my notifications for user:', req.user);
    
    // Even simpler version first - just return all notifications
    // with a flag indicating if they were created by this user
    const result = await pool.query(`
      SELECT n.*, 
             u.name as creator_name, 
             u.email as creator_email,
             (n.created_by = $1) as is_mine
      FROM notifications n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.created_by = $1
      ORDER BY n.created_at DESC
    `, [req.user.id]);
    
    console.log('Query result:', { 
      count: result.rows.length,
      firstItem: result.rows.length > 0 ? result.rows[0] : null,
      user_id: req.user.id
    });
    
    // Format dates before sending
    const formattedNotifications = formatNotificationDates(result.rows);
    res.json(formattedNotifications);
  } catch (err) {
    console.error('Error fetching user notifications:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
});

// Get read status for the current user's notifications
router.get('/read-status', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM notification_read_status WHERE user_id = $1',
      [req.user.id]
    );
    res.json(result.rows);
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
    
    // Format dates before sending
    const formattedNotifications = formatNotificationDates(result.rows);
    res.json(formattedNotifications);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single notification with user information
router.get('/:id', authenticateToken, async (req, res) => {
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
    
    // Check if user can access this notification
    const isProgramManager = req.user.role === 'programmijuht';
    const isCreator = result.rows[0].created_by === req.user.id;
    
    if (isProgramManager && isCreator) {
      // Programmijuht who created it can always see it
      return res.json(formatNotificationDates(result.rows[0]));
    }
    
    // Check if notification has group targeting
    const groupCheck = await pool.query(`
      SELECT * FROM notification_groups WHERE notification_id = $1
    `, [id]);
    
    if (groupCheck.rows.length === 0) {
      // No group targeting, everyone can see it
      return res.json(formatNotificationDates(result.rows[0]));
    }
    
    if (isProgramManager) {
      // Programmijuht sees all notifications, including those from other program managers
      return res.json(formatNotificationDates(result.rows[0]));
    }
    
    // Get user's groups
    const userGroupResult = await pool.query(`
      SELECT group_id FROM user_groups WHERE user_id = $1
    `, [req.user.id]);
    
    const userGroupIds = userGroupResult.rows.map(row => row.group_id);
    
    if (userGroupIds.length === 0) {
      return res.status(403).json({ error: 'You do not have access to this notification' });
    }
    
    // Check if any of user's groups is in the target groups
    const groupAccess = await pool.query(`
      SELECT * FROM notification_groups 
      WHERE notification_id = $1 
      AND group_id = ANY($2::int[])
    `, [id, userGroupIds]);
    
    if (groupAccess.rows.length === 0) {
      return res.status(403).json({ error: 'You do not have access to this notification' });
    }
    
    // Format the notification date before sending
    const formattedNotification = formatNotificationDates(result.rows[0]);
    res.json(formattedNotification);
  } catch (err) {
    console.error('Error fetching notification:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create notification - only for programmijuht
router.post('/', authenticateToken, checkProgramManager, async (req, res) => {
  try {
    const { title, content, category, priority, createdBy, targetGroups } = req.body;
    
    if (!title || !content || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // First check if the user exists
    const userCheck = await pool.query('SELECT id FROM users WHERE id = $1', [createdBy]);
    if (userCheck.rows.length === 0) {
      return res.status(400).json({ error: 'User not found' });
    }

    // Begin transaction
    await pool.query('BEGIN');

    // Insert notification
    const result = await pool.query(`
      INSERT INTO notifications (title, content, category, priority, created_by)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `, [title, content, category, priority, createdBy]);
    
    const notification = result.rows[0];
    
    // Add target groups if provided
    if (targetGroups && targetGroups.length > 0) {
      // Check if all groups exist
      const groupIds = targetGroups.map(g => g.id || g);
      const groupCheck = await pool.query(`
        SELECT id FROM groups WHERE id = ANY($1::int[])
      `, [groupIds]);
      
      if (groupCheck.rows.length !== groupIds.length) {
        await pool.query('ROLLBACK');
        return res.status(400).json({ error: 'One or more groups do not exist' });
      }
      
      // Insert group targeting
      const groupValues = groupIds.map((groupId, index) => {
        return `($1, $${index + 2})`;
      }).join(', ');
      
      await pool.query(`
        INSERT INTO notification_groups (notification_id, group_id)
        VALUES ${groupValues}
      `, [notification.id, ...groupIds]);
    }
    
    // Commit transaction
    await pool.query('COMMIT');
    
    // Format date before sending
    const formattedNotification = formatNotificationDates(notification);
    res.status(201).json(formattedNotification);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error creating notification:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update notification - only for programmijuht and only their own notifications
router.put('/:id', authenticateToken, checkProgramManager, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, category, priority, targetGroups } = req.body;
    
    // First check if the notification belongs to this user
    const notificationCheck = await pool.query(
      'SELECT * FROM notifications WHERE id = $1 AND created_by = $2',
      [id, req.user.id]
    );
    
    if (notificationCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. You can only update your own notifications.' });
    }
    
    // Begin transaction
    await pool.query('BEGIN');
    
    // Update notification
    const result = await pool.query(`
      UPDATE notifications
      SET title = $1, content = $2, category = $3, priority = $4
      WHERE id = $5
      RETURNING *
    `, [title, content, category, priority, id]);
    
    // Update target groups if provided
    if (targetGroups) {
      // Delete existing group associations
      await pool.query('DELETE FROM notification_groups WHERE notification_id = $1', [id]);
      
      // Add new target groups if there are any
      if (targetGroups.length > 0) {
        // Check if all groups exist
        const groupIds = targetGroups.map(g => g.id || g);
        const groupCheck = await pool.query(`
          SELECT id FROM groups WHERE id = ANY($1::int[])
        `, [groupIds]);
        
        if (groupCheck.rows.length !== groupIds.length) {
          await pool.query('ROLLBACK');
          return res.status(400).json({ error: 'One or more groups do not exist' });
        }
        
        // Insert group targeting
        const groupValues = groupIds.map((groupId, index) => {
          return `($1, $${index + 2})`;
        }).join(', ');
        
        await pool.query(`
          INSERT INTO notification_groups (notification_id, group_id)
          VALUES ${groupValues}
        `, [id, ...groupIds]);
      }
    }
    
    // Commit transaction
    await pool.query('COMMIT');
    
    // Format date before sending
    const formattedNotification = formatNotificationDates(result.rows[0]);
    res.json(formattedNotification);
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error updating notification:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Mark notification as read
router.post('/:id/read', authenticateToken, async (req, res) => {
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
});

// Get read status for a specific notification with user information
router.get('/:id/read-status', authenticateToken, async (req, res) => {
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
});

// Delete notification - only for programmijuht and only their own notifications
router.delete('/:id', authenticateToken, checkProgramManager, async (req, res) => {
  try {
    const { id } = req.params;
    
    // First check if the notification belongs to this user
    const notificationCheck = await pool.query(
      'SELECT * FROM notifications WHERE id = $1 AND created_by = $2',
      [id, req.user.id]
    );
    
    if (notificationCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied. You can only delete your own notifications.' });
    }
    
    // Begin transaction
    await pool.query('BEGIN');
    
    // Delete read status and group associations (cascade delete will handle favorites)
    await pool.query('DELETE FROM notification_read_status WHERE notification_id = $1', [id]);
    await pool.query('DELETE FROM notification_groups WHERE notification_id = $1', [id]);
    
    // Then delete the notification
    await pool.query('DELETE FROM notifications WHERE id = $1', [id]);
    
    // Commit transaction
    await pool.query('COMMIT');
    
    res.json({ message: 'Notification deleted successfully' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Error deleting notification:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;