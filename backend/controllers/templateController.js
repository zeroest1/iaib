const pool = require('../db');
const { formatNotificationDates } = require('../utils/dateFormatter');

// Get all templates for a user
const getTemplates = async (req, res) => {
  try {
    // Get all templates
    const templatesResult = await pool.query(
      `SELECT * FROM notification_templates 
       WHERE created_by = $1
       ORDER BY created_at DESC`,
      [req.user.id]
    );
    
    const templates = templatesResult.rows;
    
    // Get all template groups
    const templateGroups = await pool.query(
      `SELECT tg.template_id, g.id, g.name, g.is_role_group
       FROM template_groups tg
       JOIN groups g ON tg.group_id = g.id
       WHERE tg.template_id = ANY($1)`,
      [templates.map(t => t.id)]
    );
    
    // Group the groups by template_id
    const groupsByTemplate = {};
    templateGroups.rows.forEach(row => {
      if (!groupsByTemplate[row.template_id]) {
        groupsByTemplate[row.template_id] = [];
      }
      groupsByTemplate[row.template_id].push({
        id: row.id,
        name: row.name,
        is_role_group: row.is_role_group
      });
    });
    
    // Add groups to each template
    templates.forEach(template => {
      template.target_groups = groupsByTemplate[template.id] || [];
    });
    
    res.json(templates);
  } catch (err) {
    console.error('Error getting templates:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get template by ID
const getTemplateById = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get template
    const templateResult = await pool.query(
      `SELECT * FROM notification_templates WHERE id = $1 AND created_by = $2`,
      [id, req.user.id]
    );
    
    if (templateResult.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found' });
    }
    
    const template = templateResult.rows[0];
    
    // Get template groups
    const groupsResult = await pool.query(
      `SELECT g.id, g.name, g.is_role_group
       FROM template_groups tg
       JOIN groups g ON tg.group_id = g.id
       WHERE tg.template_id = $1`,
      [id]
    );
    
    template.target_groups = groupsResult.rows;
    
    res.json(template);
  } catch (err) {
    console.error('Error getting template:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create a new template
const createTemplate = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { name, title, content, category, priority, targetGroups } = req.body;
    
    if (!name || !title || !content) {
      return res.status(400).json({ error: 'Name, title and content are required' });
    }
    
    // Create template
    const templateResult = await client.query(
      `INSERT INTO notification_templates 
       (name, title, content, category, priority, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, title, content, category, priority, req.user.id]
    );
    
    const template = templateResult.rows[0];
    
    // Add target groups if provided
    if (targetGroups && targetGroups.length > 0) {
      const insertGroupValues = targetGroups.map((groupId, index) => 
        `($1, $${index + 2})`
      ).join(', ');
      
      await client.query(
        `INSERT INTO template_groups (template_id, group_id) VALUES ${insertGroupValues}`,
        [template.id, ...targetGroups]
      );
      
      // Get inserted groups
      const groupsResult = await client.query(
        `SELECT g.id, g.name, g.is_role_group
         FROM template_groups tg
         JOIN groups g ON tg.group_id = g.id
         WHERE tg.template_id = $1`,
        [template.id]
      );
      
      template.target_groups = groupsResult.rows;
    } else {
      template.target_groups = [];
    }
    
    await client.query('COMMIT');
    
    res.status(201).json(template);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error creating template:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// Update a template
const updateTemplate = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { name, title, content, category, priority, targetGroups } = req.body;
    
    // Check if template exists and belongs to user
    const checkResult = await client.query(
      `SELECT * FROM notification_templates WHERE id = $1 AND created_by = $2`,
      [id, req.user.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found or you are not authorized' });
    }
    
    // Update template
    const templateResult = await client.query(
      `UPDATE notification_templates 
       SET name = $1, title = $2, content = $3, category = $4, priority = $5
       WHERE id = $6 AND created_by = $7
       RETURNING *`,
      [name, title, content, category, priority, id, req.user.id]
    );
    
    const template = templateResult.rows[0];
    
    // Remove existing groups
    await client.query(
      `DELETE FROM template_groups WHERE template_id = $1`,
      [id]
    );
    
    // Add new target groups if provided
    if (targetGroups && targetGroups.length > 0) {
      const insertGroupValues = targetGroups.map((groupId, index) => 
        `($1, $${index + 2})`
      ).join(', ');
      
      await client.query(
        `INSERT INTO template_groups (template_id, group_id) VALUES ${insertGroupValues}`,
        [template.id, ...targetGroups]
      );
      
      // Get inserted groups
      const groupsResult = await client.query(
        `SELECT g.id, g.name, g.is_role_group
         FROM template_groups tg
         JOIN groups g ON tg.group_id = g.id
         WHERE tg.template_id = $1`,
        [template.id]
      );
      
      template.target_groups = groupsResult.rows;
    } else {
      template.target_groups = [];
    }
    
    await client.query('COMMIT');
    
    res.json(template);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating template:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

// Delete a template
const deleteTemplate = async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Check if template exists and belongs to user
    const checkResult = await client.query(
      `SELECT * FROM notification_templates WHERE id = $1 AND created_by = $2`,
      [id, req.user.id]
    );
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Template not found or you are not authorized' });
    }
    
    // Delete template groups first
    await client.query(
      `DELETE FROM template_groups WHERE template_id = $1`,
      [id]
    );
    
    // Delete template
    await client.query(
      `DELETE FROM notification_templates WHERE id = $1 AND created_by = $2`,
      [id, req.user.id]
    );
    
    await client.query('COMMIT');
    
    res.json({ message: 'Template deleted successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error deleting template:', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
};

module.exports = {
  getTemplates,
  getTemplateById,
  createTemplate,
  updateTemplate,
  deleteTemplate
}; 