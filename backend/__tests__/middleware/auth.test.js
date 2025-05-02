const { authenticateToken, checkProgramManager } = require('../../middleware/auth');
const { createMockRequest, createMockResponse, generateTestToken, generateAdminToken } = require('../setup');
const jwt = require('jsonwebtoken');

describe('Authentication Middleware', () => {
  describe('authenticateToken', () => {
    test('should return 401 if no token is provided', () => {
      const req = createMockRequest({
        headers: { authorization: null },
      });
      const res = createMockResponse();
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. No token provided' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should return 401 if token is invalid', () => {
      const req = createMockRequest({
        headers: { authorization: 'Bearer invalid_token' },
      });
      const res = createMockResponse();
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should call next and set user if token is valid', () => {
      const user = { id: 1, role: 'tudeng', name: 'Test User', email: 'test@example.com' };
      const token = generateTestToken(user);

      const req = createMockRequest({
        headers: { authorization: `Bearer ${token}` },
      });
      const res = createMockResponse();
      const next = jest.fn();

      authenticateToken(req, res, next);

      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(user.id);
      expect(req.user.role).toBe(user.role);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('checkProgramManager', () => {
    test('should return 403 if user is not a program manager', () => {
      const req = createMockRequest({ user: { role: 'tudeng' } });
      const res = createMockResponse();
      const next = jest.fn();

      checkProgramManager(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ error: 'Access denied. Programmijuht only.' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should call next if user is a program manager', () => {
      const req = createMockRequest({ user: { role: 'programmijuht' } });
      const res = createMockResponse();
      const next = jest.fn();

      checkProgramManager(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
}); 