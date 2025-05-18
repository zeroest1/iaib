// controllers/groupController.js
const pool = require('../db');

// Get all available groups
const getAllGroups = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM groups ORDER BY is_role_group DESC, name');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching groups:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get notification target groups
const getNotificationGroups = async (req, res) => {
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
};

// Get user's groups
const getUserGroups = async (req, res) => {
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
};

module.exports = {
  getAllGroups,
  getNotificationGroups,
  getUserGroups
}; 