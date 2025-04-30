// middleware/auth.js
const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key';

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access denied. No token provided' });
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Middleware to check if user is a programmijuht
const checkProgramManager = (req, res, next) => {
  if (req.user.role !== 'programmijuht') {
    return res.status(403).json({ error: 'Access denied. Programmijuht only.' });
  }
  next();
};

module.exports = {
  authenticateToken,
  checkProgramManager
}; 