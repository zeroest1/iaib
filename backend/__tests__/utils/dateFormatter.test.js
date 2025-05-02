const { formatNotificationDates } = require('../../utils/dateFormatter');

describe('Date Formatter Utilities', () => {
  describe('formatNotificationDates', () => {
    test('should format dates in an array of notifications', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const notifications = [
        { id: 1, created_at: date, title: 'Notification 1' },
        { id: 2, created_at: date, title: 'Notification 2' },
      ];

      const formatted = formatNotificationDates(notifications);

      expect(formatted).toHaveLength(2);
      expect(formatted[0].created_at).toBe(date.toISOString());
      expect(formatted[1].created_at).toBe(date.toISOString());
    });

    test('should format date in a single notification object', () => {
      const date = new Date('2023-01-01T12:00:00Z');
      const notification = { id: 1, created_at: date, title: 'Notification 1' };

      const formatted = formatNotificationDates(notification);

      expect(formatted.created_at).toBe(date.toISOString());
    });

    test('should handle objects without created_at property', () => {
      const notification = { id: 1, title: 'Notification 1' };

      const formatted = formatNotificationDates(notification);

      expect(formatted).toEqual(notification);
    });

    test('should handle null or undefined input', () => {
      expect(formatNotificationDates(null)).toBeNull();
      expect(formatNotificationDates(undefined)).toBeUndefined();
    });
  });
}); 