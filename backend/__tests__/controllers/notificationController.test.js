const jwt = require('jsonwebtoken');
const { formatNotificationDates } = require('../../utils/dateFormatter');

// Sample mock data
const MOCK_NOTIFICATIONS = [
  { id: 1, title: 'Test Notification 1', created_at: new Date(), created_by: 1 },
  { id: 2, title: 'Test Notification 2', created_at: new Date(), created_by: 2 }
];

// Create mock db module with specific responses for different queries
const mockDb = {
  query: jest.fn().mockImplementation((sql, params) => {
    // Specific handling based on the SQL query
    if (sql.includes('SELECT COUNT(*) FROM notifications') || sql.includes('COUNT(DISTINCT n.id)')) {
      return Promise.resolve({ rows: [{ count: '10', total: '10' }] });
    }
    if (sql.includes('SELECT DISTINCT n.*')) {
      return Promise.resolve({ rows: MOCK_NOTIFICATIONS });
    }
    if (sql.includes('SELECT group_id FROM user_groups')) {
      return Promise.resolve({ rows: [{ group_id: 1 }, { group_id: 2 }] });
    }
    if (sql.includes('SELECT * FROM notifications WHERE id') && params && params[0] === '999') {
      return Promise.resolve({ rows: [] });
    }
    if (sql.includes('SELECT n.*, u.name') && params && params[0] === '1') {
      return Promise.resolve({ 
        rows: [{ 
          id: 1, 
          created_by: 1, 
          title: 'Test', 
          created_at: new Date(),
          creator_name: 'Test User',
          creator_email: 'test@example.com'
        }] 
      });
    }
    if (sql.includes('SELECT * FROM notification_groups WHERE notification_id')) {
      return Promise.resolve({ rows: [] });
    }
    if (sql.includes('SELECT * FROM notifications WHERE id') && !sql.includes('created_by')) {
      return Promise.resolve({ rows: [{ id: 1, created_by: 1, title: 'Test', created_at: new Date() }] });
    }
    if (sql.includes('SELECT * FROM notifications WHERE id') && sql.includes('created_by')) {
      if (params && params[1] === 1) {
        return Promise.resolve({ rows: [{ id: 1, created_by: 1 }] });
      } else {
        return Promise.resolve({ rows: [] });
      }
    }
    if (sql.includes('SELECT id FROM users')) {
      return Promise.resolve({ rows: [{ id: 1 }] });
    }
    if (sql.includes('BEGIN') || sql.includes('COMMIT') || sql.includes('ROLLBACK')) {
      return Promise.resolve({});
    }
    if (sql.includes('INSERT INTO notifications')) {
      return Promise.resolve({ 
        rows: [{ 
          id: 1, 
          title: 'Test Notification',
          content: 'Test content',
          category: 'announcement',
          priority: 'high',
          created_by: 1,
          created_at: new Date()
        }] 
      });
    }
    if (sql.includes('UPDATE notifications')) {
      return Promise.resolve({ 
        rows: [{ 
          id: 1, 
          title: 'Updated Title',
          content: 'Updated content',
          category: 'announcement',
          priority: 'high',
          created_by: 1
        }] 
      });
    }
    if (sql.includes('DELETE FROM notification_read_status')) {
      return Promise.resolve({ rowCount: 1 });
    }
    if (sql.includes('DELETE FROM notification_groups')) {
      return Promise.resolve({ rowCount: 1 });
    }
    if (sql.includes('DELETE FROM favorites')) {
      return Promise.resolve({ rowCount: 1 });
    }
    if (sql.includes('DELETE FROM notifications')) {
      return Promise.resolve({ rowCount: 1 });
    }
    
    // Default empty response
    return Promise.resolve({ rows: [] });
  }),
  connect: jest.fn().mockImplementation(() => Promise.resolve({
    query: jest.fn().mockImplementation((sql, params) => {
      // Same logic as above for client.query
      if (sql.includes('BEGIN') || sql.includes('COMMIT') || sql.includes('ROLLBACK')) {
        return Promise.resolve({});
      }
      if (sql.includes('INSERT INTO notifications')) {
        return Promise.resolve({ 
          rows: [{ 
            id: 1, 
            title: 'Test Notification',
            content: 'Test content',
            category: 'announcement',
            priority: 'high',
            created_by: 1,
            created_at: new Date()
          }] 
        });
      }
      // Default
      return Promise.resolve({ rows: [] });
    }),
    release: jest.fn()
  }))
};

// Mock the modules
jest.mock('../../db', () => mockDb);

// Mock console.error to prevent test output pollution and verify calls
console.error = jest.fn();

// Mock formatNotificationDates to track calls and return the data
jest.mock('../../utils/dateFormatter', () => ({
  formatNotificationDates: jest.fn(data => {
    // Return the same data to simulate formatting
    return Array.isArray(data) ? data : { ...data };
  })
}));

// Import controllers after mocks are set up
const { 
  getAllNotifications,
  getNotificationById, 
  createNotification, 
  updateNotification, 
  deleteNotification 
} = require('../../controllers/notificationController');

describe('Notification Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    formatNotificationDates.mockClear();
    console.error.mockClear();
  });

  // Helper functions for testing
  const createMockRequest = (overrides = {}) => ({
    params: {},
    body: {},
    user: { id: 1, role: 'programmijuht' },
    query: { page: 1, limit: 10 },
    ...overrides
  });

  const createMockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  };

  describe('getAllNotifications', () => {
    test('should return all notifications', async () => {
      // Create request and response objects
      const req = createMockRequest();
      const res = createMockResponse();
      
      // Call the controller
      await getAllNotifications(req, res);
      
      // Assertions
      expect(res.json).toHaveBeenCalled();
      expect(formatNotificationDates).toHaveBeenCalled();
      
      // Verify the response structure
      const responseArg = res.json.mock.calls[0][0];
      expect(responseArg).toHaveProperty('notifications');
      expect(responseArg).toHaveProperty('pagination');
    });

    test('should handle database errors', async () => {
      // Force a database error
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));

      // Create request and response objects
      const req = createMockRequest();
      const res = createMockResponse();
      
      // Call the controller
      await getAllNotifications(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(console.error).toHaveBeenCalledWith('Error fetching notifications:', expect.any(Error));
    });

    test('should handle student role with no groups', async () => {
      // Mock user with student role and empty groups
      mockDb.query
        .mockResolvedValueOnce({ rows: [] }) // No groups
        .mockResolvedValueOnce({ rows: [{ total: '5' }] }) // Public notifications count
        .mockResolvedValueOnce({ rows: MOCK_NOTIFICATIONS }); // Public notifications

      // Create request with student role
      const req = createMockRequest({ user: { id: 2, role: 'tudeng' } });
      const res = createMockResponse();
      
      // Call the controller
      await getAllNotifications(req, res);
      
      // Assertions
      expect(res.json).toHaveBeenCalled();
      expect(formatNotificationDates).toHaveBeenCalled();
      
      const responseArg = res.json.mock.calls[0][0];
      expect(responseArg).toHaveProperty('notifications');
      expect(responseArg).toHaveProperty('pagination.total', 5);
    });
  });

  describe('getNotificationById', () => {
    test('should return 404 if notification is not found', async () => {
      // Create request and response objects
      const req = createMockRequest({ params: { id: '999' } });
      const res = createMockResponse();
      
      // Call the controller
      await getNotificationById(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Notification not found' });
    });

    test('should return notification if user is creator', async () => {
      // Create request and response objects
      const req = createMockRequest({ 
        params: { id: '1' },
        user: { id: 1, role: 'programmijuht' }
      });
      const res = createMockResponse();
      
      // Call the controller
      await getNotificationById(req, res);
      
      // Assertions
      expect(res.json).toHaveBeenCalled();
      expect(formatNotificationDates).toHaveBeenCalled();
      
      // Check that formatNotificationDates was called with the notification object
      const notification = formatNotificationDates.mock.calls[0][0];
      expect(notification).toHaveProperty('id', 1);
      expect(notification).toHaveProperty('created_by', 1);
    });

    test('should allow access to public notifications', async () => {
      // Set up: no groups for notification
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 2, created_by: 3, title: 'Public Test' }] }) // Notification not created by user
        .mockResolvedValueOnce({ rows: [] }); // No groups = public notification
      
      // Create request as non-creator
      const req = createMockRequest({ 
        params: { id: '2' },
        user: { id: 2, role: 'tudeng' }
      });
      const res = createMockResponse();
      
      // Call the controller
      await getNotificationById(req, res);
      
      // Assertions
      expect(res.json).toHaveBeenCalled();
      expect(formatNotificationDates).toHaveBeenCalled();
    });

    test('should return 403 if student without access to group notification', async () => {
      // Set up: notification has groups but user doesn't belong to any matching group
      mockDb.query
        .mockResolvedValueOnce({ rows: [{ id: 2, created_by: 3, title: 'Group Test' }] }) // Notification
        .mockResolvedValueOnce({ rows: [{ notification_id: 2, group_id: 5 }] }) // Notification has group targeting
        .mockResolvedValueOnce({ rows: [{ group_id: 1 }, { group_id: 2 }] }) // User's groups
        .mockResolvedValueOnce({ rows: [] }); // No matching groups
      
      // Create request with student role
      const req = createMockRequest({ 
        params: { id: '2' },
        user: { id: 2, role: 'tudeng' }
      });
      const res = createMockResponse();
      
      // Call the controller
      await getNotificationById(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'You do not have access to this notification' });
    });

    test('should handle database error', async () => {
      // Force a database error
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));
      
      // Create request and response objects
      const req = createMockRequest({ params: { id: '1' } });
      const res = createMockResponse();
      
      // Call the controller
      await getNotificationById(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(console.error).toHaveBeenCalledWith('Error fetching notification:', expect.any(Error));
    });
  });

  describe('createNotification', () => {
    test('should return 400 if required fields are missing', async () => {
      // Create request with missing fields
      const req = createMockRequest({ 
        body: { content: 'Test content' }, // Missing title
        user: { id: 1, role: 'programmijuht' }
      });
      const res = createMockResponse();
      
      // Call the controller
      await createNotification(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing required fields' });
    });

    test('should return 400 if user not found', async () => {
      // Mock database to return no users
      mockDb.query
        .mockImplementationOnce(() => Promise.resolve({ rows: [] })); // No user found
      
      // Create request with all required fields
      const req = createMockRequest({ 
        body: { 
          title: 'Test Notification',
          content: 'Test content',
          category: 'announcement',
          priority: 'high',
          createdBy: 999  // Non-existent user
        }
      });
      const res = createMockResponse();
      
      // Call the controller
      await createNotification(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'User not found' });
    });

    test('should create notification successfully', async () => {
      // Create request and response objects with all required fields
      const req = createMockRequest({ 
        body: { 
          title: 'Test Notification',
          content: 'Test content',
          category: 'announcement',
          priority: 'high',
          targetGroups: [],
          createdBy: 1  // Add createdBy field which is required
        },
        user: { id: 1, role: 'programmijuht' }
      });
      const res = createMockResponse();
      
      // Call the controller
      await createNotification(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    test('should create notification with target groups', async () => {
      // Create request with target groups
      const req = createMockRequest({ 
        body: { 
          title: 'Test Notification',
          content: 'Test content',
          category: 'announcement',
          priority: 'high',
          createdBy: 1,
          targetGroups: [1, 2]
        }
      });
      const res = createMockResponse();
      
      // Mock group check
      mockDb.query
        .mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 1 }] })) // User check
        .mockImplementationOnce(() => Promise.resolve({})) // BEGIN
        .mockImplementationOnce(() => Promise.resolve({ 
          rows: [{ id: 1, title: 'Test with Groups' }] 
        })) // Insert notification
        .mockImplementationOnce(() => Promise.resolve({ 
          rows: [{ id: 1 }, { id: 2 }] 
        })) // Group check
        .mockImplementationOnce(() => Promise.resolve({})) // Insert groups
        .mockImplementationOnce(() => Promise.resolve({})); // COMMIT
      
      // Call the controller
      await createNotification(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalled();
    });

    test('should handle invalid group IDs', async () => {
      // Create request with target groups
      const req = createMockRequest({ 
        body: { 
          title: 'Test Notification',
          content: 'Test content',
          category: 'announcement',
          priority: 'high',
          createdBy: 1,
          targetGroups: [1, 2, 3]
        }
      });
      const res = createMockResponse();
      
      // Mock group check to return fewer groups than requested (invalid groups)
      mockDb.query
        .mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 1 }] })) // User check
        .mockImplementationOnce(() => Promise.resolve({})) // BEGIN
        .mockImplementationOnce(() => Promise.resolve({ 
          rows: [{ id: 1, title: 'Test with Groups' }] 
        })) // Insert notification
        .mockImplementationOnce(() => Promise.resolve({ 
          rows: [{ id: 1 }] // Only one group exists, not all requested
        }));
      
      // Call the controller
      await createNotification(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'One or more groups do not exist' });
    });

    test('should handle database error', async () => {
      // Create request with valid data
      const req = createMockRequest({ 
        body: { 
          title: 'Test Notification',
          content: 'Test content',
          createdBy: 1
        }
      });
      const res = createMockResponse();
      
      // Force a database error after BEGIN
      mockDb.query
        .mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 1 }] })) // User check
        .mockImplementationOnce(() => Promise.resolve({})) // BEGIN
        .mockRejectedValueOnce(new Error('Database error')); // Error on insert
      
      // Call the controller
      await createNotification(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(console.error).toHaveBeenCalledWith('Error creating notification:', expect.any(Error));
    });
  });

  describe('updateNotification', () => {
    test('should return 403 when user is not the creator', async () => {
      // Override behavior specifically for this test to simulate 403
      mockDb.query.mockImplementationOnce(() => Promise.resolve({ rows: [] }));
      
      // Create request and response objects
      const req = createMockRequest({ 
        params: { id: '2' }, // Not owned by user 1
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

    test('should update notification with target groups', async () => {
      // Mock database responses for target groups
      mockDb.query
        .mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 1, created_by: 1 }] })) // Find notification
        .mockImplementationOnce(() => Promise.resolve({})) // BEGIN
        .mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 1, title: 'Updated' }] })) // UPDATE notification
        .mockImplementationOnce(() => Promise.resolve({})) // DELETE existing groups
        .mockImplementationOnce(() => Promise.resolve({})); // INSERT new groups
      
      // Create request with target groups
      const req = createMockRequest({ 
        params: { id: '1' },
        body: { 
          title: 'Updated Title',
          content: 'Updated content',
          category: 'announcement',
          priority: 'high',
          targetGroups: [1, 2]
        }
      });
      const res = createMockResponse();
      
      // Call the controller
      await updateNotification(req, res);
      
      // Assertions
      expect(res.json).toHaveBeenCalled();
      // Simply verify that UPDATE query was made
      expect(mockDb.query).toHaveBeenCalledWith(
        expect.stringMatching(/UPDATE notifications/),
        expect.any(Array)
      );
    });

    test('should handle invalid group IDs', async () => {
      // Mock DB responses for this specific case
      mockDb.query
        .mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 1, created_by: 1 }] })) // Find notification
        .mockImplementationOnce(() => Promise.resolve({})) // BEGIN
        .mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 1, title: 'Updated' }] })) // UPDATE
        .mockImplementationOnce(() => Promise.resolve({})) // DELETE groups
        .mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 1 }] })); // Check groups - fewer than requested
      
      // Create request with target groups
      const req = createMockRequest({ 
        params: { id: '1' },
        body: { 
          title: 'Updated Title',
          content: 'Updated content',
          category: 'announcement',
          priority: 'high',
          targetGroups: [1, 2, 3] // Request 3 groups but only 1 exists
        }
      });
      const res = createMockResponse();
      
      // Call the controller
      await updateNotification(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'One or more groups do not exist' });
    });

    test('should handle database error', async () => {
      // Force database error
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));
      
      // Create request and response objects
      const req = createMockRequest({ 
        params: { id: '1' },
        body: { 
          title: 'Updated Title',
          content: 'Updated content'
        }
      });
      const res = createMockResponse();
      
      // Call the controller
      await updateNotification(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(console.error).toHaveBeenCalledWith('Error updating notification:', expect.any(Error));
    });
  });

  describe('deleteNotification', () => {
    test('should return 404 if notification not found', async () => {
      // Override the query behavior specifically for this test
      mockDb.query.mockImplementationOnce(() => Promise.resolve({ rows: [] }));
      
      // Create request and response objects
      const req = createMockRequest({ params: { id: '999' } });
      const res = createMockResponse();
      
      // Call the controller
      await deleteNotification(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Notification not found' });
    });
    
    test('should return 403 if user is not the creator', async () => {
      // Override query behavior to simulate not being the creator
      mockDb.query
        .mockImplementationOnce(() => Promise.resolve({ rows: [{ id: 1, created_by: 2 }] })) // Notification exists
        .mockImplementationOnce(() => Promise.resolve({ rows: [] })); // But user is not creator
      
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
      // Create request and response objects
      const req = createMockRequest({ params: { id: '1' } });
      const res = createMockResponse();
      
      // Call the controller
      await deleteNotification(req, res);
      
      // Assertions
      expect(res.json).toHaveBeenCalledWith({ message: 'Notification deleted successfully' });
    });

    test('should handle database error', async () => {
      // Force database error
      mockDb.query.mockRejectedValueOnce(new Error('Database error'));
      
      // Create request and response objects
      const req = createMockRequest({ params: { id: '1' } });
      const res = createMockResponse();
      
      // Call the controller
      await deleteNotification(req, res);
      
      // Assertions
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Internal server error' });
      expect(console.error).toHaveBeenCalledWith('Error deleting notification:', expect.any(Error));
    });
  });
}); 