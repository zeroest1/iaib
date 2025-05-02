// Test setup file
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');

// Mock the database module
const mockPool = {
  query: jest.fn(),
  connect: jest.fn(() => ({
    query: jest.fn(),
    release: jest.fn(),
  })),
};

// This needs to be manually imported in each test file
jest.mock('../db', () => mockPool);

// Helper to create a mock request object
const createMockRequest = (overrides = {}) => {
  const req = {
    body: {},
    params: {},
    query: {},
    headers: {},
    user: { id: 1, role: 'tudeng', name: 'Test User', email: 'test@example.com' },
    ...overrides,
  };
  return req;
};

// Helper to create a mock response object
const createMockResponse = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  res.send = jest.fn().mockReturnValue(res);
  return res;
};

// Helper to create a jwt token for testing
const generateTestToken = (user = { id: 1, role: 'tudeng', name: 'Test User', email: 'test@example.com' }) => {
  const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';
  return jwt.sign(user, JWT_SECRET, { expiresIn: '1h' });
};

// Utility for admin token
const generateAdminToken = () => {
  return generateTestToken({ id: 2, role: 'programmijuht', name: 'Admin User', email: 'admin@example.com' });
};

// Add a dummy test so Jest doesn't complain about this file
test('setup file works', () => {
  expect(true).toBe(true);
});

module.exports = {
  createMockRequest,
  createMockResponse,
  generateTestToken,
  generateAdminToken,
  mockPool
}; 