const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
const authRoutes = require('../../routes/auth');

// Create a test app
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    test('should return 400 if email is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ password: 'password123' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email and password required');
    });

    test('should return 400 if password is missing', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'test@example.com' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Email and password required');
    });

    test('should return 401 if user is not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@example.com', password: 'password123' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM users WHERE email = $1', ['nonexistent@example.com']);
    });

    test('should return 401 if password is incorrect', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      pool.query.mockResolvedValueOnce({
        rows: [{ id: 1, email: 'user@example.com', password: hashedPassword, role: 'tudeng' }]
      });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com', password: 'wrongpassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('Invalid credentials');
    });

    test('should return token if credentials are valid', async () => {
      const password = 'correctpassword';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = { 
        id: 1, 
        email: 'user@example.com', 
        password: hashedPassword, 
        role: 'tudeng',
        name: 'Test User'
      };
      
      pool.query.mockResolvedValueOnce({ rows: [user] });

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: user.email, password });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      
      // Verify the token
      const decodedToken = jwt.verify(res.body.token, process.env.JWT_SECRET || 'dev_secret_key');
      expect(decodedToken.id).toBe(user.id);
      expect(decodedToken.role).toBe(user.role);
      expect(decodedToken.email).toBe(user.email);
    });
    
    test('should handle server errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'user@example.com', password: 'password123' });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });

  describe('GET /api/auth/me', () => {
    test('should return 401 if no token is provided', async () => {
      const res = await request(app).get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toBe('No token provided');
    });

    test('should return user data if valid token is provided', async () => {
      const user = { id: 1, name: 'Test User', email: 'test@example.com', role: 'tudeng' };
      pool.query.mockResolvedValueOnce({ rows: [user] });

      // Generate a valid token
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET || 'dev_secret_key');

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual(user);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT id, name, email, role FROM users WHERE id = $1',
        [user.id]
      );
    });

    test('should return 404 if user not found', async () => {
      pool.query.mockResolvedValueOnce({ rows: [] });

      // Generate a token for a non-existent user
      const token = jwt.sign({ id: 999 }, process.env.JWT_SECRET || 'dev_secret_key');

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('User not found');
    });
    
    test('should return 403 for invalid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalidtoken');

      expect(res.status).toBe(403);
      expect(res.body.error).toBe('Invalid token');
    });
    
    test('should handle server errors', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      // Generate a valid token
      const token = jwt.sign({ id: 1 }, process.env.JWT_SECRET || 'dev_secret_key');

      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });

  describe('POST /api/auth/register', () => {
    test('should return 400 if required fields are missing', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ 
          name: 'New User',
          email: 'newuser@example.com',
          // Missing password
          role: 'tudeng'
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('All fields are required');
    });
    
    test('should return 400 for invalid role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({ 
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'admin' // Invalid role
        });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid role');
    });
    
    test('should return 409 if email already exists', async () => {
      // Mock email check query
      pool.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }); // Email exists

      const res = await request(app)
        .post('/api/auth/register')
        .send({ 
          name: 'New User',
          email: 'existing@example.com',
          password: 'password123',
          role: 'tudeng'
        });

      expect(res.status).toBe(409);
      expect(res.body.error).toBe('Email already registered');
      expect(pool.query).toHaveBeenCalledWith('ROLLBACK');
    });
    
    test('should register user successfully without groups', async () => {
      // Mock all necessary queries for successful registration
      pool.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // Email doesn't exist
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // User created
        .mockResolvedValueOnce({}) // Role group added
        .mockResolvedValueOnce({}); // COMMIT

      const res = await request(app)
        .post('/api/auth/register')
        .send({ 
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'tudeng'
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User registered successfully');
      expect(pool.query).toHaveBeenCalledWith('COMMIT');
    });
    
    test('should register user with selected groups', async () => {
      // Mock all necessary queries for successful registration with groups
      pool.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // Email doesn't exist
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // User created
        .mockResolvedValueOnce({}) // Role group added
        .mockResolvedValueOnce({}) // Additional groups added
        .mockResolvedValueOnce({}); // COMMIT

      const res = await request(app)
        .post('/api/auth/register')
        .send({ 
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'tudeng',
          groups: [3, 4] // Additional groups
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('User registered successfully');
      // Check that groups were added
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringMatching(/INSERT INTO user_groups \(user_id, group_id\) VALUES/),
        expect.arrayContaining([1, 3, 4])
      );
    });
    
    test('should handle server errors during registration', async () => {
      // Mock database error
      pool.query
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [] }) // Email doesn't exist
        .mockRejectedValueOnce(new Error('Database error')); // Error during user creation

      const res = await request(app)
        .post('/api/auth/register')
        .send({ 
          name: 'New User',
          email: 'newuser@example.com',
          password: 'password123',
          role: 'tudeng'
        });

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
      expect(pool.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('GET /api/auth/groups', () => {
    test('should return all non-role groups', async () => {
      const mockGroups = [
        { id: 3, name: 'Group 1', is_role_group: false },
        { id: 4, name: 'Group 2', is_role_group: false }
      ];
      
      pool.query.mockResolvedValueOnce({ rows: mockGroups });

      const res = await request(app).get('/api/auth/groups');

      expect(res.status).toBe(200);
      expect(res.body).toEqual(mockGroups);
      expect(pool.query).toHaveBeenCalledWith('SELECT * FROM groups WHERE is_role_group = false ORDER BY name');
    });

    test('should handle errors when fetching groups', async () => {
      pool.query.mockRejectedValueOnce(new Error('Database error'));

      const res = await request(app).get('/api/auth/groups');

      expect(res.status).toBe(500);
      expect(res.body.error).toBe('Internal server error');
    });
  });
}); 