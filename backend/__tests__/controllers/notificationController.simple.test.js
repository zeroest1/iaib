const jwt = require('jsonwebtoken');

// Create mock db module
const mockDb = {
  query: jest.fn().mockImplementation(() => Promise.resolve({ rows: [] }))
};

// Mock the modules
jest.mock('../../db', () => mockDb);
jest.mock('../../utils/dateFormatter', () => ({
  formatNotificationDates: jest.fn(data => data)
}));

// Import controllers after mocks are set up
const { getNotificationById, deleteNotification, updateNotification } = require('../../controllers/notificationController');

describe('Notification Controller - Simple Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Helper functions for testing
  const createMockRequest = (overrides = {}) => ({
    params: {},
    body: {},
    user: { id: 1, role: 'programmijuht' },
    ...overrides
  });

  const createMockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  describe('getNotificationById', () => {
    test('should return 404 when notification not found', async () => {
      // Setup mocks
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      
      // Create request and response objects
      const req = createMockRequest({ params: { id: '999' } });
      const res = createMockResponse();
      
      // Call the controller
      await getNotificationById(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Notification not found' });
    });
  });

  describe('updateNotification', () => {
    test('should return 403 when user is not the creator', async () => {
      // Setup mocks
      mockDb.query.mockResolvedValueOnce({ rows: [] }); // No notification found for this user
      
      // Create request and response objects
      const req = createMockRequest({ 
        params: { id: '1' },
        body: { 
          title: 'Updated Title', 
          content: 'Updated content',
          category: 'announcement',
          priority: 'high'
        }
      });
      const res = createMockResponse();
      
      // Call the controller
      await updateNotification(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Access denied. You can only update your own notifications.' 
      });
    });
    
    test('should update notification successfully', async () => {
      // Setup mocks for a successful update
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 1, created_by: 1 }] }) // Notification exists and belongs to user
        .mockResolvedValueOnce({}) // BEGIN transaction
        .mockResolvedValueOnce({ rows: [{ id: 1, title: 'Updated Title', content: 'Updated content' }] }) // UPDATE notification
        .mockResolvedValueOnce({}) // DELETE from notification_groups
        .mockResolvedValueOnce({}) // COMMIT transaction
      
      // Create request and response objects
      const req = createMockRequest({ 
        params: { id: '1' },
        body: { 
          title: 'Updated Title', 
          content: 'Updated content',
          category: 'announcement',
          priority: 'high',
          targetGroups: []
        }
      });
      const res = createMockResponse();
      
      // Call the controller
      await updateNotification(req, res);
      
      // Assertions
      expect(res.status).not.toHaveBeenCalledWith(403);
      expect(res.status).not.toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalled();
    });
  });

  describe('deleteNotification', () => {
    test('should return 404 when notification not found', async () => {
      // Setup mocks for each query in the sequence
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      
      // Create request and response objects
      const req = createMockRequest({ params: { id: '999' } });
      const res = createMockResponse();
      
      // Call the controller
      await deleteNotification(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Notification not found' });
    });
    
    test('should return 403 when user is not the creator', async () => {
      // Notification exists but doesn't belong to the user
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 1, created_by: 2 }] }) // Notification exists
        .mockResolvedValueOnce({ rows: [] });                        // Not created by user
      
      // Create request and response objects
      const req = createMockRequest({ params: { id: '1' } });
      const res = createMockResponse();
      
      // Call the controller
      await deleteNotification(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Access denied. You can only delete your own notifications.'
      });
    });
    
    test('should delete notification successfully', async () => {
      // Setup all mocks in the sequence
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 1, created_by: 1 }] }) // Notification exists
        .mockResolvedValueOnce({ rows: [{ id: 1, created_by: 1 }] }) // User is creator
        .mockResolvedValueOnce({})                                  // BEGIN
        .mockResolvedValueOnce({ rowCount: 1 })                     // Delete read status
        .mockResolvedValueOnce({ rowCount: 1 })                     // Delete notification groups
        .mockResolvedValueOnce({ rowCount: 1 })                     // Delete favorites
        .mockResolvedValueOnce({ rowCount: 1 })                     // Delete notification
        .mockResolvedValueOnce({});                                 // COMMIT
      
      // Create request and response objects
      const req = createMockRequest({ params: { id: '1' } });
      const res = createMockResponse();
      
      // Call the controller
      await deleteNotification(req, res);
      
      // Assertions
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification deleted successfully' });
    });
  });
}); 