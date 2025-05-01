const pool = require('../db');
const { formatNotificationDates } = require('../utils/dateFormatter');

// Get all templates for a user
const getTemplates = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notification_templates 
       WHERE created_by = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    
    res.json(result.rows);
  } catch (err) {
    console.error('Error getting templates:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get template by ID
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      `SELECT * FROM notification_templates WHERE id = $1 AND created_by = $2`,
      [id, req.user.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error getting template:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new template
const createTemplate = async (req, res) => {
  try {
    const { name, title, content, category, priority } = req.body;
    
    if (!name || !title || !content) {
      return res.status(400).json({ error: 'Name, title and content are required' });
    }
    
    const result = await pool.query(
      `INSERT INTO notification_templates 
       (name, title, content, category, priority, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, title, content, category, priority, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Error creating template:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a template
const updateTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, title, content, category, priority } = req.body;
    
    // Check if template exists and belongs to user
    const checkResult = await pool.query(
      `SELECT * FROM notification_templates WHERE id = $1 AND created_by = $2`,
      [id, req.user.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found or you are not authorized' });
    }
    
    const result = await pool.query(
      `UPDATE notification_templates 
       SET name = $1, title = $2, content = $3, category = $4, priority = $5
       WHERE id = $6 AND created_by = $7
       RETURNING *`,
      [name, title, content, category, priority, id, req.user.id]
    );
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error updating template:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete a template
const deleteTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if template exists and belongs to user
    const checkResult = await pool.query(
      `SELECT * FROM notification_templates WHERE id = $1 AND created_by = $2`,
      [id, req.user.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found or you are not authorized' });
    }
    
    await pool.query(
      `DELETE FROM notification_templates WHERE id = $1 AND created_by = $2`,
      [id, req.user.id]
    );
    
    res.json({ message: 'Template deleted successfully' });
  } catch (err) {
    console.error('Error deleting template:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
}; 