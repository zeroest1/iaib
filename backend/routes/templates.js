// routes/templates.js
const express = require('express');
const router = express.Router();
const { authenticateToken, checkProgramManager } = require('../middleware/auth');
const templateController = require('../controllers/templateController');

// All template routes require authentication and program manager role
router.use(authenticateToken, checkProgramManager);

// Get all templates for current user
router.get('/', templateController.getTemplates);

// Create a new template
router.post('/', templateController.createTemplate);

// Get a specific template
router.get('/:id', templateController.getTemplateById);

// Update a template
router.put('/:id', templateController.updateTemplate);

// Delete a template
router.delete('/:id', templateController.deleteTemplate);

module.exports = router; 