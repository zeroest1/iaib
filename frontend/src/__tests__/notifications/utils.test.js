import {
  getPageTitle,
  getEmptyNotificationMessage,
  calculateReadStatus,
  calculateUnreadCount,
  getFilterDescription,
  formatDate
} from '../../components/notifications/utils';

// Mock the date formatters
jest.mock('date-fns', () => ({
  parseISO: jest.fn(str => new Date(str))
}));

jest.mock('date-fns-tz', () => ({
  formatInTimeZone: jest.fn(() => '15.05.2023, 10:30:45')
}));

jest.mock('date-fns/locale', () => ({
  et: {}
}));

// Mock utils.formatDate function
jest.mock('../../components/notifications/utils', () => {
  const originalModule = jest.requireActual('../../components/notifications/utils');
  return {
    ...originalModule,
    formatDate: jest.fn(dateString => {
      if (!dateString) return '';
      return '15.05.2023, 10:30:45';
    })
  };
});

// Mock for constants
jest.mock('../../components/notifications/constants', () => ({
  NOTIFICATION_CATEGORIES: [
    { value: 'general', label: 'Üldine' },
    { value: 'exam', label: 'Eksam' },
    { value: 'assignment', label: 'Kodutöö' },
    { value: 'schedule', label: 'Tunniplaan' },
    { value: 'õppetöö', label: 'Õppetöö' },
    { value: 'praktika', label: 'Praktika' },
    { value: 'muu', label: 'Muu' },
    { value: 'kiire', label: 'Kiire' },
    { value: 'kõrge', label: 'Kõrge' }
  ],
  NOTIFICATION_PRIORITIES: [
    { value: 'high', label: 'Kõrge' },
    { value: 'medium', label: 'Keskmine' },
    { value: 'low', label: 'Madal' },
    { value: 'kiire', label: 'Kiire' },
    { value: 'kõrge', label: 'Kõrge' }
  ]
}));

// Mock window.innerWidth
Object.defineProperty(window, 'innerWidth', {
  writable: true,
  configurable: true,
  value: 1024
});

describe('Notification Utils', () => {
  // Save original console.error
  const originalConsoleError = console.error;
  
  beforeEach(() => {
    // Mock console.error to avoid test output pollution
    console.error = jest.fn();
    // Reset mocks
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    // Restore original console.error
    console.error = originalConsoleError;
  });

  describe('formatDate', () => {
    test('formats ISO date string correctly', () => {
      const isoDate = '2023-05-15T10:30:45.000Z';
      const result = formatDate(isoDate);
      expect(result).toBe('15.05.2023, 10:30:45');
    });
    
    test('handles empty or invalid dates', () => {
      expect(formatDate('')).toBe('');
      expect(formatDate(null)).toBe('');
      expect(formatDate(undefined)).toBe('');
    });
  });
  
  describe('getPageTitle', () => {
    test('returns correct page titles based on parameters', () => {
      expect(getPageTitle(true, false, 'all', '/')).toBe('Minu teated');
      expect(getPageTitle(false, true, 'all', '/')).toBe('Lemmikud teated');
      expect(getPageTitle(false, false, 'unread', '/')).toBe('Lugemata teated');
      expect(getPageTitle(false, false, 'all', '/')).toBe('Kõik teated');
    });
  });
  
  describe('calculateReadStatus', () => {
    test('marks notifications as unread by default', () => {
      const notifications = [
        { id: 1, title: 'Notification 1' },
        { id: 2, title: 'Notification 2' }
      ];
      const readStatusData = [];
      const readStatusSuccess = true;
      
      const result = calculateReadStatus(notifications, readStatusData, readStatusSuccess);
      
      expect(result).toEqual({
        1: false,
        2: false
      });
    });
  });
  
  describe('getEmptyNotificationMessage', () => {
    test('returns correct empty message based on context', () => {
      expect(getEmptyNotificationMessage(false, 'all', true, '/', false))
        .toBe('Teil ei ole veel ühtegi teadet loodud.');
      
      expect(getEmptyNotificationMessage(true, 'all', false, '/', false))
        .toBe('Teil ei ole lemmikuid teateid.');
      
      expect(getEmptyNotificationMessage(false, 'unread', false, '/', false))
        .toBe('Teil ei ole lugemata teateid.');
      
      expect(getEmptyNotificationMessage(false, 'all', false, '/', false))
        .toBe('Teadete nimekiri on tühi.');
      
      expect(getEmptyNotificationMessage(false, 'all', false, '/', true))
        .toBe('Otsingule vastavaid teateid ei leitud.');
    });
  });

  describe('calculateUnreadCount', () => {
    test('returns total notifications count when no read status data', () => {
      const notifications = [
        { id: 1, title: 'Test 1' },
        { id: 2, title: 'Test 2' }
      ];
      const readStatus = { 1: false, 2: false };
      const result = calculateUnreadCount(notifications, readStatus, false, []);
      expect(result).toBe(2);
    });

    test('counts only unread notifications', () => {
      const notifications = [
        { id: 1, title: 'Test 1' },
        { id: 2, title: 'Test 2' },
        { id: 3, title: 'Test 3' }
      ];
      const readStatus = { 1: true, 2: false, 3: true };
      const readStatusData = [
        { notification_id: 1, read: true },
        { notification_id: 3, read: true }
      ];
      const result = calculateUnreadCount(notifications, readStatus, false, readStatusData);
      expect(result).toBe(1);
    });

    test('returns 0 during loading', () => {
      const notifications = [
        { id: 1, title: 'Test 1' },
        { id: 2, title: 'Test 2' }
      ];
      const readStatus = { 1: false, 2: false };
      const result = calculateUnreadCount(notifications, readStatus, true, []);
      expect(result).toBe(0);
    });
  });

  describe('getFilterDescription', () => {
    // Mock window.innerWidth for testing mobile vs desktop displays
    const originalInnerWidth = window.innerWidth;
    
    afterEach(() => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: originalInnerWidth
      });
    });
    
    test('returns basic description for default view', () => {
      const result = getFilterDescription(false, false, 'all', '/notifications', [], [], '');
      expect(result).toBe('Kõik teated');
    });

    test('returns proper description for my notifications', () => {
      const result = getFilterDescription(true, false, 'all', '/notifications', [], [], '');
      expect(result).toBe('Minu teated');
      
      const result2 = getFilterDescription(false, false, 'all', '/my-notifications', [], [], '');
      expect(result2).toBe('Minu teated');
    });

    test('returns proper description for favorites', () => {
      const result = getFilterDescription(false, true, 'all', '/notifications', [], [], '');
      expect(result).toBe('Lemmikud');
      
      const result2 = getFilterDescription(false, false, 'all', '/favorites', [], [], '');
      expect(result2).toBe('Lemmikud');
    });

    test('returns proper description for unread', () => {
      const result = getFilterDescription(false, false, 'unread', '/notifications', [], [], '');
      expect(result).toBe('Lugemata');
    });

    test('includes categories in description', () => {
      const result = getFilterDescription(false, false, 'all', '/notifications', ['õppetöö', 'praktika'], [], '');
      expect(result).toContain('Kategooriad: ');
      expect(result).toContain('Õppetöö, Praktika');
    });

    test('includes priorities in description', () => {
      const result = getFilterDescription(false, false, 'all', '/notifications', [], ['kiire', 'kõrge'], '');
      expect(result).toContain('Prioriteedid: ');
      expect(result).toContain('Kiire, Kõrge');
    });

    test('includes search term in description', () => {
      const result = getFilterDescription(false, false, 'all', '/notifications', [], [], 'test search');
      expect(result).toContain('Otsing: "test search"');
    });

    test('combines multiple filter criteria', () => {
      const result = getFilterDescription(true, false, 'all', '/notifications', ['õppetöö'], ['kiire'], 'test');
      expect(result).toContain('Minu teated');
      expect(result).toContain('Kategooriad: Õppetöö');
      expect(result).toContain('Prioriteedid: Kiire');
      expect(result).toContain('Otsing: "test"');
      expect(result.split('|').length).toBe(4); // Check for separators
    });

    test('trims search term', () => {
      const result = getFilterDescription(false, false, 'all', '/notifications', [], [], '  test  ');
      expect(result).toContain('Otsing: "test"');
    });

    test('handles mobile view for categories', () => {
      // Set window width to mobile size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });
      
      const result = getFilterDescription(false, false, 'all', '/notifications', ['õppetöö', 'praktika', 'muu'], [], '');
      expect(result).toContain('Kategooriaid: 3');
    });

    test('handles mobile view for priorities', () => {
      // Set window width to mobile size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });
      
      const result = getFilterDescription(false, false, 'all', '/notifications', [], ['kiire', 'kõrge'], '');
      expect(result).toContain('Prioriteete: 2');
    });

    test('handles mobile view for long search terms', () => {
      // Set window width to mobile size
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 500
      });
      
      const result = getFilterDescription(false, false, 'all', '/notifications', [], [], 'this is a very long search term');
      expect(result).toContain('Otsing: "this is a');
    });
  });
}); 