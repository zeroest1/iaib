module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^react-router-dom$': '<rootDir>/src/__mocks__/react-router-dom.js',
    '^../../services/api$': '<rootDir>/src/__mocks__/services/api.js'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  testMatch: ['**/__tests__/**/*.test.(js|jsx)'],
  transformIgnorePatterns: [
    '/node_modules/(?!(@reduxjs|react-redux|react-router|react-router-dom|@standard-schema)/)',
  ],
  collectCoverageFrom: [
    'src/**/*.{js,jsx}',
    '!src/index.js',
    '!src/serviceWorker.js',
    '!src/reportWebVitals.js',
    '!src/setupTests.js',
    '!src/__mocks__/**',
    '!src/mocks/**',
  ]
}; 