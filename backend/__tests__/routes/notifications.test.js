const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { generateTestToken, generateAdminToken } = require('../setup');

// Mock the database module first
jest.mock('../../db', () => {
  return {
    query: jest.fn(),
    connect: jest.fn(() => ({
      query: jest.fn(),
      release: jest.fn(),
    })),
  };
});

// Import after mocking
const pool = require('../../db');
const notificationRoutes = require('../../routes/notifications');

// Mock the dateFormatter module
jest.mock('../../utils/dateFormatter', () => ({
  formatNotificationDates: jest.fn(data => data)
}));

// Create a test app
const app = express();
app.use(express.json());
// Mock auth middleware to allow us to test with different users
app.use((req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret_key');
      req.user = decoded;
    } catch (err) {
      return res.status(401).json({ error: 'Invalid token' });
    }
  }
  next();
});
app.use('/api/notifications', notificationRoutes);

describe('Notification Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/notifications', () => {
    test('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/notifications');
      expect(res.status).toBe(401);
    });

    test('should return notifications for tudeng user', async () => {
      const mockNotifications = [
        { id: 1, title: 'Notification 1', created_at: new Date().toISOString() },
        { id: 2, title: 'Notification 2', created_at: new Date().toISOString() }
      ];

      // Mock user groups query
      pool.query.mockResolvedValueOnce({ rows: [{ group_id: 1 }] });
      // Mock count query
      pool.query.mockResolvedValueOnce({ rows: [{ total: '2' }] });
      // Mock notifications query
      pool.query.mockResolvedValueOnce({ rows: mockNotifications });

      const token = generateTestToken({ id: 1, role: 'tudeng' });
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('notifications');
      expect(res.body).toHaveProperty('pagination');
      expect(res.body.notifications).toHaveLength(2);
    });

    test('should return notifications for programmijuht user', async () => {
      const mockNotifications = [
        { id: 1, title: 'Notification 1', created_by: 2, created_at: new Date().toISOString() },
        { id: 2, title: 'Notification 2', created_by: 2, created_at: new Date().toISOString() }
      ];

      // Mock user groups query
      pool.query.mockResolvedValueOnce({ rows: [{ group_id: 2 }] });
      // Mock count query
      pool.query.mockResolvedValueOnce({ rows: [{ total: '2' }] });
      // Mock notifications query
      pool.query.mockResolvedValueOnce({ rows: mockNotifications });

      const token = generateAdminToken();
      const res = await request(app)
        .get('/api/notifications')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('notifications');
      expect(res.body.notifications).toHaveLength(2);
    });
  });

  describe('GET /api/notifications/:id', () => {
    test('should return 404 if notification not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const token = generateTestToken();
      const res = await request(app)
        .get('/api/notifications/999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Notification not found');
    });

    test('should return notification if accessible', async () => {
      const notification = { 
        id: 1, 
        title: 'Test Notification', 
        created_by: 2,
        created_at: new Date().toISOString()
      };
      
      pool.query.mockResolvedValueOnce({ rows: [notification] });
      // Mock notification groups query (empty = public notification)
      pool.query.mockResolvedValueOnce({ rows: [] });

      const token = generateTestToken();
      const res = await request(app)
        .get('/api/notifications/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(notification);
    });
  });

  describe('POST /api/notifications', () => {
    test('should return 401 if not authenticated', async () => {
      const res = await request(app)
        .post('/api/notifications')
        .send({ title: 'Test', content: 'Test content' });
        
      expect(res.status).toBe(401);
    });

    test('should return 403 if not programmijuht', async () => {
      const token = generateTestToken({ id: 1, role: 'tudeng' });
      const res = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${token}`)
        .send({ title: 'Test', content: 'Test content' });
        
      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Access denied. Programmijuht only.');
    });

    test('should create notification if programmijuht', async () => {
      const notification = {
        title: 'Test Notification', 
        content: 'Test content',
        priority: 'high',
        category: 'announcement',
        createdBy: 2, // Match the createdBy field from controller
        targetGroups: []  // Match targetGroups field from controller
      };

      // Check if user exists
      pool.query.mockResolvedValueOnce({ rows: [{ id: 2 }] });
      // Begin transaction
      pool.query.mockResolvedValueOnce({});
      // Insert notification
      pool.query.mockResolvedValueOnce({ 
        rows: [{ 
          id: 1, 
          ...notification,
          created_by: 2,
          created_at: new Date().toISOString()
        }] 
      });
      // Commit transaction
      pool.query.mockResolvedValueOnce({});

      const token = generateAdminToken(); // User ID 2
      const res = await request(app)
        .post('/api/notifications')
        .set('Authorization', `Bearer ${token}`)
        .send(notification);
        
      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id', 1);
    });
  });

  describe('DELETE /api/notifications/:id', () => {
    test('should return 404 if notification not found', async () => {
      // Check if notification exists
      pool.query.mockResolvedValueOnce({ rows: [] });

      const token = generateAdminToken();
      const res = await request(app)
        .delete('/api/notifications/999')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Notification not found');
    });

    test('should return 403 if not creator', async () => {
      // Notification exists
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, created_by: 3 }] });
      // But user is not creator
      pool.query.mockResolvedValueOnce({ rows: [] });

      const token = generateAdminToken(); // User ID 2
      const res = await request(app)
        .delete('/api/notifications/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Access denied. You can only delete your own notifications.');
    });

    test('should delete notification if creator', async () => {
      // Notification exists
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, created_by: 2 }] });
      // User is creator
      pool.query.mockResolvedValueOnce({ rows: [{ id: 1, created_by: 2 }] });
      // Begin transaction
      pool.query.mockResolvedValueOnce({});
      // Delete notification read status
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      // Delete notification groups
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      // Delete favorites
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      // Delete notification
      pool.query.mockResolvedValueOnce({ rowCount: 1 });
      // Commit transaction
      pool.query.mockResolvedValueOnce({});

      const token = generateAdminToken(); // User ID 2
      const res = await request(app)
        .delete('/api/notifications/1')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Notification deleted successfully');
    });
  });
}); 