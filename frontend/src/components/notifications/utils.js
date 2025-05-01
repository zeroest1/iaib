// Import constants for notification categories and priorities
import { NOTIFICATION_CATEGORIES, NOTIFICATION_PRIORITIES } from './constants';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { et } from 'date-fns/locale';

/**
 * Format a date with Estonian locale and timezone
 */
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  try {
    // Handle different date formats from PostgreSQL
    let date;
    
    // If it's already a Date object
    if (dateString instanceof Date) {
      date = dateString;
    } 
    // If it's an ISO string
    else if (typeof dateString === 'string') {
      // Clean the string (PostgreSQL can return timestamps with 'T' or ' ' separator)
      const cleanDateString = dateString.replace(' ', 'T');
      date = parseISO(cleanDateString);
    } 
    // If it's a number (timestamp)
    else if (typeof dateString === 'number') {
      date = new Date(dateString);
    } 
    // Fallback
    else {
      date = new Date(dateString);
    }
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date: ${dateString}`);
    }
    
    // Use date-fns-tz to format with the Estonian timezone
    return formatInTimeZone(date, 'Europe/Tallinn', 'dd.MM.yyyy, HH:mm:ss', { locale: et });
  } catch (error) {
    console.error('Error formatting date:', error, typeof dateString, dateString);
    return String(dateString);
  }
};

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
 * Get appropriate page title based on filters
 */
export const getPageTitle = (isMyNotifications, showFavoritesOnly, filter, pathname) => {
  if (isMyNotifications || pathname === '/my-notifications') return 'Minu teated';
  if (showFavoritesOnly || pathname === '/favorites') return 'Lemmikud teated';
  if (filter === 'unread') return 'Lugemata teated';
  return 'Kõik teated';
};

/**
 * Get filter description text based on current filters
 */
export const getFilterDescription = (isMyNotifications, showFavoritesOnly, filter, pathname, selectedCategories, selectedPriorities, searchTerm) => {
  let description = [];
  
  // Base filter
  if (isMyNotifications || pathname === '/my-notifications') {
    description.push('Minu teated');
  } else if (showFavoritesOnly || pathname === '/favorites') {
    description.push('Lemmikud');
  } else if (filter === 'unread') {
    description.push('Lugemata');
  } else {
    description.push('Kõik teated');
  }
  
  // Check if we're on mobile with window width less than 576px
  const isMobile = window.innerWidth <= 576;
  
  // Category filters
  if (selectedCategories && selectedCategories.length > 0) {
    if (isMobile && selectedCategories.length > 1) {
      // For mobile with multiple selections, show abbreviated format
      description.push(`Kategooriaid: ${selectedCategories.length}`);
    } else {
      const categoryLabels = selectedCategories.map(cat => {
        const match = NOTIFICATION_CATEGORIES.find(c => c.value === cat);
        return match ? match.label : cat;
      });
      description.push(`Kategooriad: ${categoryLabels.join(', ')}`);
    }
  }
  
  // Priority filters
  if (selectedPriorities && selectedPriorities.length > 0) {
    if (isMobile && selectedPriorities.length > 1) {
      // For mobile with multiple selections, show abbreviated format
      description.push(`Prioriteete: ${selectedPriorities.length}`);
    } else {
      const priorityLabels = selectedPriorities.map(pri => {
        const match = NOTIFICATION_PRIORITIES.find(p => p.value === pri);
        return match ? match.label : pri;
      });
      description.push(`Prioriteedid: ${priorityLabels.join(', ')}`);
    }
  }
  
  // Search term
  if (searchTerm && searchTerm.trim()) {
    if (isMobile && searchTerm.trim().length > 10) {
      // For mobile with long search term, truncate it
      description.push(`Otsing: "${searchTerm.trim().substring(0, 10)}..."`);
    } else {
      description.push(`Otsing: "${searchTerm.trim()}"`);
    }
  }
  
  return description.join(' | ');
};

/**
 * Get empty notification message based on filters
 */
export const getEmptyNotificationMessage = (showFavoritesOnly, filter, isMyNotifications, pathname, hasSearch) => {
  if (hasSearch) {
    return 'Otsingule vastavaid teateid ei leitud.';
  }
  
  if (isMyNotifications || pathname === '/my-notifications') {
    return 'Teil ei ole veel ühtegi teadet loodud.';
  }
  
  if (showFavoritesOnly || pathname === '/favorites') {
    return 'Teil ei ole lemmikuid teateid.';
  }
  
  if (filter === 'unread') {
    return 'Teil ei ole lugemata teateid.';
  }
  
  return 'Teadete nimekiri on tühi.';
}; 