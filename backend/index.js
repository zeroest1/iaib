// backend/index.js
const express = require('express');
const cors = require('cors');
const notificationRoutes = require('./routes/notifications');
const authRoutes = require('./routes/auth');
const favoritesRoutes = require('./routes/favorites');
const templateRoutes = require('./routes/templates');
const path = require('path');
const { swaggerUi, swaggerSpec } = require('./swagger');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use('/api/notifications', notificationRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/favorites', favoritesRoutes);
app.use('/api/templates', templateRoutes);

// Simple route
app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Swagger documentation available at http://localhost:${PORT}/api-docs`);
});
