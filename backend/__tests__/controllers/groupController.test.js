const jwt = require('jsonwebtoken');

// Create mock db module
const mockDb = {
  query: jest.fn().mockImplementation(() => Promise.resolve({ rows: [] }))
};

// Mock the modules
jest.mock('../../db', () => mockDb);

// Import controllers after mocks are set up
const { 
  getAllGroups, 
  getNotificationGroups, 
  getUserGroups 
} = require('../../controllers/groupController');

describe('Group Controller', () => {
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

  describe('getAllGroups', () => {
    test('should return all groups', async () => {
      const mockGroups = [
        { id: 1, name: 'Group 1', is_role_group: true },
        { id: 2, name: 'Group 2', is_role_group: false }
      ];
      
      // Mock groups response
      mockDb.query.mockResolvedValueOnce({ rows: mockGroups });
      
      const req = createMockRequest();
      const res = createMockResponse();
      
      await getAllGroups(req, res);
      
      expect(mockDb.query).toHaveBeenCalledWith('SELECT * FROM groups ORDER BY is_role_group DESC, name');
      expect(res.json).toHaveBeenCalledWith(mockGroups);
    });
    
    test('should handle errors', async () => {
      // Mock database error
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));
      
      const req = createMockRequest();
      const res = createMockResponse();
      
      await getAllGroups(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
  
  describe('getNotificationGroups', () => {
    test('should return groups for a notification', async () => {
      const mockGroups = [
        { id: 1, name: 'Group 1', is_role_group: true },
        { id: 2, name: 'Group 2', is_role_group: false }
      ];
      
      // Mock notification groups
      mockDb.query.mockResolvedValueOnce({ rows: mockGroups });
      
      const req = createMockRequest({ params: { id: '5' } });
      const res = createMockResponse();
      
      await getNotificationGroups(req, res);
      
      // Using a more flexible test approach
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.any(String),
        ['5']
      );
      expect(res.json).toHaveBeenCalledWith(mockGroups);
    });
    
    test('should handle errors', async () => {
      // Mock database error
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));
      
      const req = createMockRequest({ params: { id: '5' } });
      const res = createMockResponse();
      
      await getNotificationGroups(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
  
  describe('getUserGroups', () => {
    test('should return groups for current user', async () => {
      const mockGroups = [
        { id: 1, name: 'Group 1', is_role_group: true },
        { id: 2, name: 'Group 2', is_role_group: false }
      ];
      
      // Mock user groups
      mockDb.query.mockResolvedValueOnce({ rows: mockGroups });
      
      const req = createMockRequest();
      const res = createMockResponse();
      
      await getUserGroups(req, res);
      
      // Using a more flexible test approach
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.any(String),
        [1]
      );
      expect(res.json).toHaveBeenCalledWith(mockGroups);
    });
    
    test('should handle errors', async () => {
      // Mock database error
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));
      
      const req = createMockRequest();
      const res = createMockResponse();
      
      await getUserGroups(req, res);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
    });
  });
}); 