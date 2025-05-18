const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Swagger configuration for API documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API Documentation',
      version: '1.0.0',
      description: 'API documentation for the application',
      contact: {
        name: 'API Support',
      },
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server',
      },
    ],
  },
  // API documentation source files
  apis: [
    './docs/swagger/schemas.js',
    './docs/swagger/auth.js',
    './docs/swagger/notifications.js',
    './docs/swagger/templates.js',
    './docs/swagger/favorites.js',
    './docs/swagger/basic.js',
    './index.js'
  ],
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

module.exports = {
  swaggerUi,
  swaggerSpec,
}; 