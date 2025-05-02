const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { generateTestToken } = require('../setup');

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
const favoritesRoutes = require('../../routes/favorites');

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
app.use('/api/favorites', favoritesRoutes);

describe('Favorites Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/favorites', () => {
    test('should return 401 if not authenticated', async () => {
      const res = await request(app).get('/api/favorites');
      expect(res.status).toBe(401);
    });

    test('should return user favorites if authenticated', async () => {
      const mockFavorites = [
        { notification_id: 1 },
        { notification_id: 3 }
      ];
      pool.query.mockResolvedValueOnce({ rows: mockFavorites });

      const token = generateTestToken();
      const res = await request(app)
        .get('/api/favorites')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockFavorites);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT f.notification_id FROM favorites f WHERE f.user_id = $1',
        [1]
      );
    });
  });

  describe('POST /api/favorites', () => {
    test('should return 400 if notificationId is missing', async () => {
      const token = generateTestToken();
      const res = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${token}`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Notification ID required');
    });

    test('should add notification to favorites', async () => {
      pool.query.mockResolvedValueOnce({});

      const token = generateTestToken();
      const res = await request(app)
        .post('/api/favorites')
        .set('Authorization', `Bearer ${token}`)
        .send({ notificationId: 5 });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Added to favorites');
      expect(pool.query).toHaveBeenCalledWith(
        'INSERT INTO favorites (user_id, notification_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [1, 5]
      );
    });
  });

  describe('DELETE /api/favorites/:notificationId', () => {
    test('should remove notification from favorites', async () => {
      pool.query.mockResolvedValueOnce({});

      const token = generateTestToken();
      const res = await request(app)
        .delete('/api/favorites/5')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Removed from favorites');
      expect(pool.query).toHaveBeenCalledWith(
        'DELETE FROM favorites WHERE user_id = $1 AND notification_id = $2',
        [1, '5']
      );
    });
  });
}); 