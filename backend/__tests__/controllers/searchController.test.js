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
const { 
  searchNotifications,
  getMyNotifications 
} = require('../../controllers/searchController');

// Import the dateFormatter mock
const { formatNotificationDates } = require('../../utils/dateFormatter');

describe('Search Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.log to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
  });

  // Helper functions for testing
  const createMockRequest = (overrides = {}) => ({
    params: {},
    query: {},
    user: { id: 1, role: 'programmijuht' },
    ...overrides
  });

  const createMockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  describe('searchNotifications', () => {
    test('should return 400 if search query is missing', async () => {
      const req = createMockRequest({ query: { } });  // Empty search query
      const res = createMockResponse();
      
      await searchNotifications(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Search query is required' });
    });
    
    test('should return 400 if search query is empty', async () => {
      const req = createMockRequest({ query: { query: '  ' } });  // Empty search query
      const res = createMockResponse();
      
      await searchNotifications(req, res);
      
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Search query is required' });
    });
    
    test('should return search results for program manager', async () => {
      // Mock user groups
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ group_id: 1 }, { group_id: 2 }] }) // User groups
        .mockResolvedValueOnce({ rows: [{ total: '2' }] }) // Count query
        .mockResolvedValueOnce({ // Search results
          rows: [
            { id: 1, title: 'Matching Notification 1', created_at: new Date() },
            { id: 2, title: 'Matching Notification 2', created_at: new Date() }
          ]
        });
      
      const req = createMockRequest({ 
        query: { query: 'test', page: '1', limit: '10' },
        user: { id: 1, role: 'programmijuht' } 
      });
      const res = createMockResponse();
      
      await searchNotifications(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        notifications: expect.any(Array),
        pagination: expect.objectContaining({
          total: 2,
          page: 1,
          limit: 10
        })
      }));
      expect(formatNotificationDates).toHaveBeenCalled();
    });
    
    test('should return search results for tudeng with groups', async () => {
      // Mock user groups
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ group_id: 1 }, { group_id: 2 }] }) // User groups
        .mockResolvedValueOnce({ rows: [{ total: '1' }] }) // Count query
        .mockResolvedValueOnce({ // Search results
          rows: [
            { id: 1, title: 'Matching Notification 1', created_at: new Date() }
          ]
        });
      
      const req = createMockRequest({ 
        query: { query: 'test', page: '1', limit: '10' },
        user: { id: 1, role: 'tudeng' } 
      });
      const res = createMockResponse();
      
      await searchNotifications(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        notifications: expect.any(Array),
        pagination: expect.objectContaining({
          total: 1,
          page: 1,
          limit: 10
        })
      }));
      expect(formatNotificationDates).toHaveBeenCalled();
    });
    
    test('should return search results for tudeng without groups', async () => {
      // Mock user groups - empty array
      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // No user groups
        .mockResolvedValueOnce({ rows: [{ total: '1' }] }) // Count query
        .mockResolvedValueOnce({ // Search results
          rows: [
            { id: 1, title: 'Public Notification', created_at: new Date() }
          ]
        });
      
      const req = createMockRequest({ 
        query: { query: 'test', page: '1', limit: '10' },
        user: { id: 1, role: 'tudeng' } 
      });
      const res = createMockResponse();
      
      await searchNotifications(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        notifications: expect.any(Array),
        pagination: expect.objectContaining({
          total: 1,
          page: 1,
          limit: 10
        })
      }));
    });
    
    test('should handle database errors', async () => {
      // Mock database error
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));
      
      const req = createMockRequest({ 
        query: { query: 'test' },
        user: { id: 1, role: 'programmijuht' } 
      });
      const res = createMockResponse();
      
      await searchNotifications(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
  
  describe('getMyNotifications', () => {
    test('should return notifications created by user', async () => {
      // Mock count and results
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ total: '2' }] }) // Count query
        .mockResolvedValueOnce({ // Results
          rows: [
            { id: 1, title: 'My Notification 1', created_by: 1, created_at: new Date() },
            { id: 2, title: 'My Notification 2', created_by: 1, created_at: new Date() }
          ]
        });
      
      const req = createMockRequest({
        query: { page: '1', limit: '10' },
        user: { id: 1, role: 'programmijuht' }
      });
      const res = createMockResponse();
      
      await getMyNotifications(req, res);
      
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        notifications: expect.any(Array),
        pagination: expect.objectContaining({
          total: 2,
          page: 1,
          limit: 10
        })
      }));
      expect(formatNotificationDates).toHaveBeenCalled();
    });
    
    test('should handle database errors', async () => {
      // Mock database error
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));
      
      const req = createMockRequest({
        user: { id: 1, role: 'programmijuht' }
      });
      const res = createMockResponse();
      
      await getMyNotifications(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
        error: 'Internal server error'
      }));
    });
  });
}); 