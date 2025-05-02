const jwt = require('jsonwebtoken');

// Create mock db module
const mockDb = {
  query: jest.fn().mockImplementation(() => Promise.resolve({ rows: [] }))
};

// Mock the modules
jest.mock('../../db', () => mockDb);

// Import controllers after mocks are set up
const { 
  markNotificationAsRead, 
  getNotificationReadStatus, 
  getUserReadStatus, 
  getUnreadNotifications 
} = require('../../controllers/notificationStatusController');

describe('Notification Status Controller', () => {
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

  describe('markNotificationAsRead', () => {
    test('should update existing read status', async () => {
      // Mock existing read status
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 1, user_id: 1, notification_id: 5, read: false }] }) // Status exists
        .mockResolvedValueOnce({ rows: [{ affected: 1 }] }); // Update successful
      
      const req = createMockRequest({ params: { id: '5' } });
      const res = createMockResponse();
      
      await markNotificationAsRead(req, res);
      
      // Verify that the UPDATE query was called
      expect(mockDb.query).toHaveBeenCalledWith(
        'UPDATE notification_read_status SET read = true WHERE user_id = $1 AND notification_id = $2',
        [1, '5']
      );
      
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification marked as read' });
    });
    
    test('should insert new read status if none exists', async () => {
      // Mock no existing read status
      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // No status exists
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Insert successful
      
      const req = createMockRequest({ params: { id: '5' } });
      const res = createMockResponse();
      
      await markNotificationAsRead(req, res);
      
      // Verify that the INSERT query was called
      expect(mockDb.query).toHaveBeenCalledWith(
        'INSERT INTO notification_read_status (user_id, notification_id, read) VALUES ($1, $2, true)',
        [1, '5']
      );
      
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification marked as read' });
    });
    
    test('should handle errors', async () => {
      // Mock database error
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));
      
      const req = createMockRequest({ params: { id: '5' } });
      const res = createMockResponse();
      
      await markNotificationAsRead(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
  
  describe('getNotificationReadStatus', () => {
    test('should return 404 if notification not found', async () => {
      // Mock notification not found
      mockDb.query.mockResolvedValueOnce({ rows: [] });
      
      const req = createMockRequest({ params: { id: '999' } });
      const res = createMockResponse();
      
      await getNotificationReadStatus(req, res);
      
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Notification not found' });
    });
    
    test('should return 403 if user is not the creator', async () => {
      // Mock notification exists but user is not creator
      mockDb.query.mockResolvedValueOnce({ rows: [{ created_by: 2 }] });
      
      const req = createMockRequest({ 
        params: { id: '5' },
        user: { id: 1, role: 'programmijuht' }
      });
      const res = createMockResponse();
      
      await getNotificationReadStatus(req, res);
      
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Access denied. Only the creator can view read status.' 
      });
    });
    
    test('should return read status for creator', async () => {
      const mockReadStatus = [
        { user_id: 2, name: 'User 2', read: true },
        { user_id: 3, name: 'User 3', read: true }
      ];
      
      // Mock successful responses
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ created_by: 1 }] }) // User is creator
        .mockResolvedValueOnce({ rows: mockReadStatus }); // Read status
      
      const req = createMockRequest({ 
        params: { id: '5' },
        user: { id: 1, role: 'programmijuht' }
      });
      const res = createMockResponse();
      
      await getNotificationReadStatus(req, res);
      
      expect(res.json).toHaveBeenCalledWith(mockReadStatus);
    });
    
    test('should handle errors', async () => {
      // Mock database error
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));
      
      const req = createMockRequest({ params: { id: '5' } });
      const res = createMockResponse();
      
      await getNotificationReadStatus(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
  
  describe('getUserReadStatus', () => {
    test('should return read status for current user', async () => {
      const mockReadStatus = [
        { notification_id: 1, read: true },
        { notification_id: 2, read: true }
      ];
      
      // Mock user read status
      mockDb.query.mockResolvedValueOnce({ rows: mockReadStatus });
      
      const req = createMockRequest();
      const res = createMockResponse();
      
      await getUserReadStatus(req, res);
      
      expect(mockDb.query).toHaveBeenCalledWith(
        'SELECT * FROM notification_read_status WHERE user_id = $1',
        [1]
      );
      expect(res.json).toHaveBeenCalledWith(mockReadStatus);
    });
    
    test('should handle errors', async () => {
      // Mock database error
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));
      
      const req = createMockRequest();
      const res = createMockResponse();
      
      await getUserReadStatus(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
  
  describe('getUnreadNotifications', () => {
    test('should return unread notifications for current user', async () => {
      const mockUnreadNotifications = [
        { id: 1, title: 'Unread Notification 1' },
        { id: 2, title: 'Unread Notification 2' }
      ];
      
      // Mock unread notifications
      mockDb.query.mockResolvedValueOnce({ rows: mockUnreadNotifications });
      
      const req = createMockRequest();
      const res = createMockResponse();
      
      await getUnreadNotifications(req, res);
      
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringMatching(/SELECT n.\* FROM notifications n/),
        [1]
      );
      expect(res.json).toHaveBeenCalledWith(mockUnreadNotifications);
    });
    
    test('should handle errors', async () => {
      // Mock database error
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));
      
      const req = createMockRequest();
      const res = createMockResponse();
      
      await getUnreadNotifications(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
}); 