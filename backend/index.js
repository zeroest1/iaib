// backend/index.js
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const notificationRoutes = require('./routes/notifications');
const authRoutes = require('./routes/auth');
const favoritesRoutes = require('./routes/favorites');
const templateRoutes = require('./routes/templates');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());


app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/templates', templateRoutes);

// PostgreSQL connection
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// Simple route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
