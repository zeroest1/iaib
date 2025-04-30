// controllers/searchController.js
const pool = require('../db');
const { formatNotificationDates } = require('../utils/dateFormatter');

// Search notifications
const searchNotifications = async (req, res) => {
  try {
    const { query } = req.query;
    
    // Pagination parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
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
    let totalCount;
    
    if (isProgramManager) {
      // Get total count for program managers
      const countResult = await pool.query(`
        SELECT COUNT(DISTINCT n.id) as total
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
      `, [req.user.id, userGroupIds.length > 0 ? userGroupIds : [null], `%${query}%`]);
      
      totalCount = parseInt(countResult.rows[0].total);
      
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
        LIMIT $4 OFFSET $5
      `, [req.user.id, userGroupIds.length > 0 ? userGroupIds : [null], `%${query}%`, limit, offset]);
    } else {
      // Regular users can search in:
      // 1. Notifications targeted to their groups
      // 2. Public notifications (no group targeting)
      if (userGroupIds.length === 0) {
        // Get total count for users with no groups
        const countResult = await pool.query(`
          SELECT COUNT(DISTINCT n.id) as total
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
        `, [`%${query}%`]);
        
        totalCount = parseInt(countResult.rows[0].total);
        
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
          LIMIT $2 OFFSET $3
        `, [`%${query}%`, limit, offset]);
      } else {
        // Get total count for users with groups
        const countResult = await pool.query(`
          SELECT COUNT(DISTINCT n.id) as total
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
        `, [userGroupIds, `%${query}%`]);
        
        totalCount = parseInt(countResult.rows[0].total);
        
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
          LIMIT $3 OFFSET $4
        `, [userGroupIds, `%${query}%`, limit, offset]);
      }
    }
    
    const totalPages = Math.ceil(totalCount / limit);
    
    // Format dates before sending
    const formattedNotifications = formatNotificationDates(result.rows);
    return res.json({
      notifications: formattedNotifications,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error searching notifications:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get my notifications
const getMyNotifications = async (req, res) => {
  try {
    // Pagination parameters with defaults
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    console.log('Fetching my notifications for user:', req.user);
    
    // Get total count first
    const countResult = await pool.query(`
      SELECT COUNT(n.id) as total
      FROM notifications n
      WHERE n.created_by = $1
    `, [req.user.id]);
    
    const totalCount = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(totalCount / limit);
    
    // Get paginated results
    const result = await pool.query(`
      SELECT n.*, 
             u.name as creator_name, 
             u.email as creator_email,
             (n.created_by = $1) as is_mine
      FROM notifications n
      LEFT JOIN users u ON n.created_by = u.id
      WHERE n.created_by = $1
      ORDER BY n.created_at DESC
      LIMIT $2 OFFSET $3
    `, [req.user.id, limit, offset]);
    
    console.log('Query result:', { 
      count: result.rows.length,
      firstItem: result.rows.length > 0 ? result.rows[0] : null,
      user_id: req.user.id
    });
    
    // Format dates before sending
    const formattedNotifications = formatNotificationDates(result.rows);
    res.json({
      notifications: formattedNotifications,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages
      }
    });
  } catch (err) {
    console.error('Error fetching user notifications:', err);
    res.status(500).json({ error: 'Internal server error', details: err.message });
  }
};

module.exports = {
  searchNotifications,
  getMyNotifications
}; 