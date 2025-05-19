// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
import React from 'react';

// Mock for constants
jest.mock('./components/notifications/constants', () => ({
  NOTIFICATION_CATEGORIES: [
    { value: 'general', label: 'Üldine' },
    { value: 'exam', label: 'Eksam' },
    { value: 'assignment', label: 'Kodutöö' },
    { value: 'schedule', label: 'Tunniplaan' }
  ],
  NOTIFICATION_PRIORITIES: [
    { value: 'high', label: 'Kõrge' },
    { value: 'medium', label: 'Keskmine' },
    { value: 'low', label: 'Madal' }
  ]
}));

// Mock the date-fns modules
jest.mock('date-fns', () => ({
  parseISO: jest.fn(str => new Date(str)),
}));

jest.mock('date-fns-tz', () => ({
  formatInTimeZone: jest.fn((date, timezone, format) => {
    if (date instanceof Date && !isNaN(date)) {
      return '15.05.2023, 10:30:45';
    }
    return '';
  }),
}));

jest.mock('date-fns/locale', () => ({
  et: {},
}));

// Mock window.innerWidth for getFilterDescription test
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024
});

// Make sure formatDate always returns the expected format for tests
jest.mock('./components/notifications/utils', () => {
  const originalModule = jest.requireActual('./components/notifications/utils');
  return {
    ...originalModule,
    formatDate: jest.fn(dateString => {
      if (!dateString) return '';
      return '15.05.2023, 10:30:45';
    })
  };
});
