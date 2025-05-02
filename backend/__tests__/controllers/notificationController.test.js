const { mockPool } = require('../setup');
const { createMockRequest, createMockResponse } = require('../setup');
const { formatNotificationDates } = require('../../utils/dateFormatter');
const { 
  getAllNotifications, 
  getNotificationById, 
  createNotification, 
  updateNotification, 
  deleteNotification 
} = require('../../controllers/notificationController');

// Create mock client for transactions
const mockClient = {
  query: jest.fn().mockImplementation(() => Promise.resolve({ rows: [] })),
  release: jest.fn()
};

// Mock the database module
jest.mock('../../db', () => {
  return {
    query: jest.fn().mockImplementation(() => Promise.resolve({ rows: [] })),
    connect: jest.fn().mockImplementation(() => Promise.resolve(mockClient))
  };
});

// Mock the dateFormatter module
jest.mock('../../utils/dateFormatter', () => ({
  formatNotificationDates: jest.fn(data => data)
}));

// Get a reference to the mocked db.js module
const pool = require('../../db');

describe('Notification Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getNotificationById', () => {
    test('should return 404 if notification is not found', async () => {
      // Mock the query to return empty rows (notification not found)
      pool.query.mockResolvedValueOnce({ rows: [] });

      const req = createMockRequest({ params: { id: 999 } });
      const res = createMockResponse();

      await getNotificationById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Notification not found' });
    });

    test('should return notification if user is creator', async () => {
      const notification = { 
        id: 1, 
        title: 'Test Notification',
        created_by: 1,
        created_at: new Date()
      };
      
      // Override default mock for this test
      pool.query
        // First query - get notification
        .mockResolvedValueOnce({ rows: [notification] })
        // Second query - no group restrictions (empty rows = no restrictions)
        .mockResolvedValueOnce({ rows: [] });

      const req = createMockRequest({ 
        params: { id: 1 },
        user: { id: 1, role: 'programmijuht' }
      });
      const res = createMockResponse();

      await getNotificationById(req, res);

      expect(res.json).toHaveBeenCalled();
      expect(formatNotificationDates).toHaveBeenCalledWith(notification);
    });
  });

  describe('createNotification', () => {
    test('should return 400 if required fields are missing', async () => {
      const req = createMockRequest({ 
        body: { content: 'Test content' }, // Missing title and createdBy
        user: { id: 1, role: 'programmijuht' }
      });
      const res = createMockResponse();

      await createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
    });

    test('should create notification successfully', async () => {
      const newNotification = { 
        title: 'Test Notification',
        content: 'Test content',
        category: 'announcement',
        priority: 'high',
        createdBy: 1,
        targetGroups: [] // Add the targetGroups to match controller
      };
      
      // Set up mocks for client-based transaction
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN 
        .mockResolvedValueOnce({ 
          rows: [{ 
            id: 1, 
            title: newNotification.title,
            content: newNotification.content,
            category: newNotification.category,
            priority: newNotification.priority,
            created_by: newNotification.createdBy,
            created_at: new Date()
          }] 
        }) // INSERT
        .mockResolvedValueOnce({}); // COMMIT

      // Mock user exists check
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const req = createMockRequest({ 
        body: newNotification,
        user: { id: 1, role: 'programmijuht' }
      });
      const res = createMockResponse();

      await createNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
      expect(formatNotificationDates).toHaveBeenCalled();
    });
  });

  describe('deleteNotification', () => {
    test('should return 404 if notification not found', async () => {
      // Set up mocks for transaction
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN transaction
        .mockResolvedValueOnce({ rows: [] }); // notification not found
      
      // Mock connect to get client
      pool.connect.mockResolvedValueOnce(mockClient);

      const req = createMockRequest({ 
        params: { id: 999 },
        user: { id: 1, role: 'programmijuht' }
      });
      const res = createMockResponse();

      await deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Notification not found' });
    });

    test('should return 403 if user is not the creator', async () => {
      // Set up mocks for transaction
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN transaction
        .mockResolvedValueOnce({ rows: [{ id: 1, created_by: 2 }] }) // Notification exists
        .mockResolvedValueOnce({ rows: [] }); // Not created by user
      
      // Mock connect to get client
      pool.connect.mockResolvedValueOnce(mockClient);

      const req = createMockRequest({ 
        params: { id: 1 },
        user: { id: 1, role: 'programmijuht' }
      });
      const res = createMockResponse();

      await deleteNotification(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. You can only delete your own notifications.' });
    });

    test('should delete notification successfully', async () => {
      // Set up mocks for transaction
      mockClient.query
        .mockResolvedValueOnce({}) // BEGIN transaction
        .mockResolvedValueOnce({ rows: [{ id: 1, created_by: 1 }] }) // Notification exists
        .mockResolvedValueOnce({ rows: [{ id: 1, created_by: 1 }] }) // User is creator
        .mockResolvedValueOnce({ rowCount: 1 }) // Delete read status
        .mockResolvedValueOnce({ rowCount: 1 }) // Delete notification groups
        .mockResolvedValueOnce({ rowCount: 1 }) // Delete favorites
        .mockResolvedValueOnce({ rowCount: 1 }) // Delete notification
        .mockResolvedValueOnce({}); // COMMIT
      
      // Mock connect to get client
      pool.connect.mockResolvedValueOnce(mockClient);

      const req = createMockRequest({ 
        params: { id: 1 },
        user: { id: 1, role: 'programmijuht' }
      });
      const res = createMockResponse();

      await deleteNotification(req, res);

      expect(mockClient.query).toHaveBeenCalledTimes(8);
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification deleted successfully' });
    });
  });
}); 