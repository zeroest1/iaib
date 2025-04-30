const pool = require('../db');
const { formatNotificationDates } = require('../utils/dateFormatter');

// Get all notifications with user information, filtered by user's groups
const getAllNotifications = async (req, res) => {
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
};

// Get single notification with user information
const getNotificationById = async (req, res) => {
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
};

// Create notification - only for programmijuht
const createNotification = async (req, res) => {
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
};

// Update notification - only for programmijuht and only their own notifications
const updateNotification = async (req, res) => {
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
};

// Delete notification - only for programmijuht and only their own notifications
const deleteNotification = async (req, res) => {
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
};

module.exports = {
  getAllNotifications,
  getNotificationById,
  createNotification,
  updateNotification,
  deleteNotification
}; 