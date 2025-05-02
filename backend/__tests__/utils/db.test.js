const { Pool } = require('pg');

// Mock modules before requiring anything else
jest.mock('pg', () => {
  const mockConnect = jest.fn((callback) => {
    if (callback) {
      callback(null, {}, jest.fn());
    }
    return Promise.resolve({});
  });
  
  const mockOn = jest.fn();
  const mockQuery = jest.fn().mockResolvedValue({ rows: [] });
  
  // Create a mock Pool constructor that tracks the config passed to it
  const MockPool = jest.fn((config) => {
    MockPool.lastConfig = config;
    return {
      connect: mockConnect,
      on: mockOn,
      query: mockQuery
    };
  });
  
  return { Pool: MockPool };
});

jest.mock('dotenv', () => ({
  config: jest.fn()
}));

describe('Database Connection', () => {
  // Save original console methods
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalExit = process.exit;
  
  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    jest.resetModules();
    
    // Mock console methods
    console.log = jest.fn();
    console.error = jest.fn();
    process.exit = jest.fn();
    
    // Reset any environment variables that might affect tests
    delete process.env.DATABASE_URL;
    delete process.env.DB_USER;
    delete process.env.DB_HOST;
    delete process.env.DB_PASSWORD;
    delete process.env.DB_NAME;
    delete process.env.DB_PORT;
  });
  
  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError; 
    process.exit = originalExit;
  });
  
  test('should use DATABASE_URL if provided', () => {
    // Set up environment
    process.env.DATABASE_URL = 'postgres://user:pass@host:5432/db';
    
    // Import the database module
    const { Pool } = require('pg');
    const db = require('../../db');
    
    // Check the configuration used to create the Pool instance
    expect(Pool.lastConfig).toEqual({ connectionString: 'postgres://user:pass@host:5432/db' });
    expect(console.log).toHaveBeenCalledWith('Using DATABASE_URL for PostgreSQL connection');
  });
  
  test('should use individual parameters if DATABASE_URL is not provided', () => {
    // Set up environment variables
    process.env.DB_USER = 'testuser';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PASSWORD = 'password';
    process.env.DB_NAME = 'testdb';
    process.env.DB_PORT = '5432';
    
    // Import the database module
    const { Pool } = require('pg');
    const db = require('../../db');
    
    // Check the configuration used to create the Pool instance
    expect(Pool.lastConfig).toEqual({
      user: 'testuser',
      host: 'localhost',
      password: 'password',
      database: 'testdb',
      port: '5432'
    });
    expect(console.log).toHaveBeenCalledWith('Using individual connection parameters for PostgreSQL');
  });
  
  test('should test connection on initialization', () => {
    // Import the database module
    const { Pool } = require('pg');
    const db = require('../../db');
    
    // Verify connection was tested
    expect(console.log).toHaveBeenCalledWith('Successfully connected to the database');
  });
  
  test('should handle connection errors', () => {
    // First mock the Pool connection to simulate an error without actually throwing
    const { Pool } = require('pg');
    const mockErrorHandler = jest.fn();
    
    // Just set our callback to simulate the error in db.js without actually throwing
    Pool.mockImplementationOnce((config) => {
      return {
        connect: (callback) => {
          // Call the callback with an error
          if (callback) {
            callback(new Error('Test connection error'), null, jest.fn());
          }
          
          // But don't actually reject the promise in the test - just return a fake promise
          // that won't crash the test but will let the callback-based error flow through
          return {
            then: (fn) => {
              // We won't call fn since we want to simulate an error
              // But we need to return an object with a catch method
              return { catch: mockErrorHandler };
            },
            catch: mockErrorHandler
          };
        },
        on: jest.fn(),
        query: jest.fn()
      };
    });
    
    // Import the database module (triggers the connection test)
    const db = require('../../db');
    
    // Verify that console.error was called
    expect(console.error).toHaveBeenCalled();
    
    // Verify first parameter is correct
    expect(console.error.mock.calls[0][0]).toBe('Error connecting to the database:');
    
    // Verify exit was called with error code
    expect(process.exit).toHaveBeenCalledWith(1);
  });
  
  test('should set up timezone', () => {
    // Import the database module
    const { Pool } = require('pg');
    const db = require('../../db');
    
    // Verify event handler was set up
    const poolInstance = Pool.mock.results[0].value;
    expect(poolInstance.on).toHaveBeenCalledWith('connect', expect.any(Function));
  });
}); 