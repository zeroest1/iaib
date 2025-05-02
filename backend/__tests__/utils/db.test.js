const { Pool } = require('pg');

// Mock the pg module
jest.mock('pg', () => {
  const mockPool = {
    on: jest.fn(),
    connect: jest.fn().mockImplementation(callback => {
      const mockClient = {};
      const release = jest.fn();
      callback(null, mockClient, release);
      return Promise.resolve(mockClient);
    }),
    query: jest.fn().mockResolvedValue({ rows: [] })
  };
  return { Pool: jest.fn(() => mockPool) };
});

// Mock dotenv
jest.mock('dotenv', () => ({
  config: jest.fn()
}));

// Mock process.exit
const processExitMock = jest.spyOn(process, 'exit').mockImplementation(() => {});

describe('Database Connection', () => {
  let originalEnv;
  
  beforeEach(() => {
    jest.clearAllMocks();
    // Save original env
    originalEnv = { ...process.env };
    // Reset module registry before each test
    jest.resetModules();
    
    // Mock console logs to avoid cluttering test output
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    // Restore console logs
    console.log.mockRestore();
    console.error.mockRestore();
    // Restore original env
    process.env = originalEnv;
  });
  
  test('should create a pool with connection string if DATABASE_URL is provided', () => {
    // Mock environment variables
    process.env.DATABASE_URL = 'postgres://user:pass@host:5432/database';
    
    // Import the module after setting environment variables
    const db = require('../../db');
    
    // Verify Pool was called with correct config
    expect(Pool).toHaveBeenCalledWith({
      connectionString: 'postgres://user:pass@host:5432/database'
    });
  });
  
  test('should create a pool with individual params if DATABASE_URL is not provided', () => {
    // Mock environment variables
    process.env.DB_USER = 'testuser';
    process.env.DB_HOST = 'localhost';
    process.env.DB_PASSWORD = 'password';
    process.env.DB_NAME = 'testdb';
    process.env.DB_PORT = '5432';
    
    // Import the module after setting environment variables
    const db = require('../../db');
    
    // Verify Pool was called with correct config
    expect(Pool).toHaveBeenCalledWith({
      user: 'testuser',
      host: 'localhost',
      password: 'password',
      database: 'testdb',
      port: '5432'
    });
  });
  
  test('should test connection on initialization', () => {
    const db = require('../../db');
    
    // The connect method will be called during initialization
    expect(Pool.mock.results[0].value.connect).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('Successfully connected to the database');
  });
  
  test('should handle connection errors', () => {
    // Override connect to simulate an error
    Pool.mockImplementationOnce(() => ({
      on: jest.fn(),
      connect: jest.fn().mockImplementation(callback => {
        callback(new Error('Connection error'), null, jest.fn());
      }),
      query: jest.fn()
    }));
    
    const db = require('../../db');
    
    expect(console.error).toHaveBeenCalledWith(
      'Error connecting to the database:',
      expect.any(String)
    );
    expect(processExitMock).toHaveBeenCalledWith(1);
  });
  
  test('should set up event handlers', () => {
    const db = require('../../db');
    
    expect(Pool.mock.results[0].value.on).toHaveBeenCalledWith('connect', expect.any(Function));
  });
}); 