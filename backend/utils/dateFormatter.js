// utils/dateFormatter.js

// Helper function to format notification timestamps to ISO format in the correct timezone
const formatNotificationDates = (data) => {
  // Handle array of notifications
  if (Array.isArray(data)) {
    return data.map(notification => {
      if (notification.created_at) {
        notification.created_at = new Date(notification.created_at).toISOString();
      }
      return notification;
    });
  }
  
  // Handle single notification
  if (data && data.created_at) {
    data.created_at = new Date(data.created_at).toISOString();
  }
  return data;
};

module.exports = {
  formatNotificationDates
}; 