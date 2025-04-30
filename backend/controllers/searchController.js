// controllers/searchController.js
const pool = require('../db');
const { formatNotificationDates } = require('../utils/dateFormatter');

// Search notifications
const searchNotifications = async (req, res) => {
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
};

// Get my notifications
const getMyNotifications = async (req, res) => {
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
};

module.exports = {
  searchNotifications,
  getMyNotifications
}; 