// routes/notifications.js
const express = require('express');
const router = express.Router();
const { authenticateToken, checkProgramManager } = require('../middleware/auth');
const { formatNotificationDates } = require('../utils/dateFormatter');
const notificationController = require('../controllers/notificationController');
const notificationStatusController = require('../controllers/notificationStatusController');
const groupController = require('../controllers/groupController');
const searchController = require('../controllers/searchController');

// Search routes
router.get('/search', authenticateToken, searchController.searchNotifications);
router.get('/my', authenticateToken, searchController.getMyNotifications);

// Status routes
router.get('/read-status', authenticateToken, notificationStatusController.getUserReadStatus);
router.get('/unread', authenticateToken, notificationStatusController.getUnreadNotifications);

// Group routes
router.get('/groups', authenticateToken, groupController.getAllGroups);
router.get('/user-groups', authenticateToken, groupController.getUserGroups);

// Routes with :id parameter
router.post('/:id/read', authenticateToken, notificationStatusController.markNotificationAsRead);
router.get('/:id/read-status', authenticateToken, notificationStatusController.getNotificationReadStatus);
router.get('/:id/groups', authenticateToken, groupController.getNotificationGroups);
router.get('/:id', authenticateToken, notificationController.getNotificationById);
router.put('/:id', authenticateToken, checkProgramManager, notificationController.updateNotification);
router.delete('/:id', authenticateToken, checkProgramManager, notificationController.deleteNotification);

// Root routes
router.get('/', authenticateToken, notificationController.getAllNotifications);
router.post('/', authenticateToken, checkProgramManager, notificationController.createNotification);

module.exports = router; 