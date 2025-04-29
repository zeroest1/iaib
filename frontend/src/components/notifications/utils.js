// Import constants for notification categories and priorities
import { NOTIFICATION_CATEGORIES, NOTIFICATION_PRIORITIES } from './constants';

/**
 * Calculate read status from server data
 */
export const calculateReadStatus = (notifications, readStatusData, readStatusSuccess) => {
  // Create an object where all notifications are marked as unread by default
  const status = {};
  
  // Mark all notifications as unread by default
  if (notifications && notifications.length > 0) {
    notifications.forEach(notification => {
      status[notification.id] = false; // Mark all as unread by default
    });
  }
  
  // If readStatusData exists and is not empty, update the read status for those notifications
  if (readStatusSuccess && readStatusData && readStatusData.length > 0) {
    readStatusData.forEach(item => {
      status[item.notification_id] = item.read;
    });
  }
  
  return status;
};

/**
 * Calculate unread count from data
 */
export const calculateUnreadCount = (notifications, readStatus, notificationsLoading, readStatusData) => {
  if (notificationsLoading) return 0;
  
  // For new users with no readStatusData, all notifications are unread
  if (notifications.length > 0 && (!readStatusData || readStatusData.length === 0)) {
    return notifications.length;
  }
  
  // Otherwise count notifications marked as not read in readStatus
  return notifications.filter(n => readStatus[n.id] === false).length;
};

/**
 * Get page title based on filters
 */
export const getPageTitle = (isMyNotifications, showFavoritesOnly, filter, pathname) => {
  if (isMyNotifications || pathname === '/my-notifications') 
    return 'Minu teated';
  if (showFavoritesOnly || pathname === '/favorites') 
    return 'Lemmikud';
  if (filter === 'unread') 
    return 'Lugemata teated';
  return 'Teated';
};

/**
 * Generates a human-readable description of current filters
 */
export const getFilterDescription = (isMyNotifications, showFavoritesOnly, filter, pathname, selectedCategories, selectedPriorities) => {
  const parts = [];
  
  // Filter type
  if (filter === 'unread' || pathname.includes('unread')) {
    parts.push('Lugemata');
  }
  
  if (showFavoritesOnly || pathname.includes('favorites')) {
    parts.push('Lemmikud');
  }
  
  if (isMyNotifications || pathname.includes('my-notifications')) {
    parts.push('Minu loodud');
  }
  
  // Categories
  if (selectedCategories && selectedCategories.length > 0) {
    if (selectedCategories.length === 1) {
      // Get the proper label from constants
      const categoryLabel = NOTIFICATION_CATEGORIES.find(c => c.value === selectedCategories[0])?.label || selectedCategories[0];
      parts.push(`Kategooria: ${categoryLabel}`);
    } else {
      parts.push(`Kategooriad: ${selectedCategories.length}`);
    }
  }
  
  // Priorities
  if (selectedPriorities && selectedPriorities.length > 0) {
    if (selectedPriorities.length === 1) {
      // Get the proper label from constants
      const priorityLabel = NOTIFICATION_PRIORITIES.find(p => p.value === selectedPriorities[0])?.label || selectedPriorities[0];
      parts.push(`Prioriteet: ${priorityLabel}`);
    } else {
      parts.push(`Prioriteedid: ${selectedPriorities.length}`);
    }
  }
  
  return parts.length > 0 ? parts.join(', ') : '';
};

/**
 * Generate empty notification message based on filters
 */
export const getEmptyNotificationMessage = (showFavoritesOnly, filter, isMyNotifications, pathname) => {
  if (showFavoritesOnly || pathname === '/favorites') {
    return 'Lemmikute nimekiri on tühi';
  } else if (filter === 'unread') {
    return 'Lugemata teateid ei ole';
  } else if (isMyNotifications || pathname === '/my-notifications') {
    return 'Te ei ole veel ühtegi teadet loonud';
  } else {
    return 'Teateid ei ole';
  }
}; 