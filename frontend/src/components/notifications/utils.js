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
 * Get human-readable description of current filters
 */
export const getFilterDescription = (isMyNotifications, showFavoritesOnly, filter, pathname, selectedCategories, selectedPriorities) => {
  let description = [];

  if (isMyNotifications || pathname === '/my-notifications')
    description.push('Minu teated');
  else if (showFavoritesOnly || pathname === '/favorites')
    description.push('Lemmikud');
  else if (filter === 'unread')
    description.push('Lugemata');

  if (selectedCategories.length > 0) {
    if (selectedCategories.length === 1) {
      description.push(`Kategooria: ${NOTIFICATION_CATEGORIES.find(c => c.value === selectedCategories[0])?.label || selectedCategories[0]}`);
    } else {
      description.push(`${selectedCategories.length} kategooriat`);
    }
  }

  if (selectedPriorities.length > 0) {
    if (selectedPriorities.length === 1) {
      description.push(`Prioriteet: ${NOTIFICATION_PRIORITIES.find(p => p.value === selectedPriorities[0])?.label || selectedPriorities[0]}`);
    } else {
      description.push(`${selectedPriorities.length} prioriteeti`);
    }
  }

  return description.length > 0 ? description.join(', ') : 'Kõik teated';
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