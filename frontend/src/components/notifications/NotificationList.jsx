// src/components/NotificationList.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './styles/NotificationList.css';
import NotificationItem from './NotificationItem';
import NotificationFilters from './NotificationFilters';
import EmptyNotifications from './EmptyNotifications';
import ConfirmationModal from '../common/ConfirmationModal';
import { POLLING_INTERVAL } from './constants';
import {
  calculateReadStatus,
  getPageTitle,
  getFilterDescription
} from './utils';
import {
  useGetNotificationsQuery,
  useGetFavoritesQuery,
  useGetReadStatusQuery,
  useDeleteNotificationMutation,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
  useMarkAsReadMutation,
  useSearchNotificationsQuery
} from '../../services/api';

const NotificationList = ({ filter = 'all', onFavoritesChange, onUnreadChange }) => {
  const { user } = useSelector(state => state.auth);
  const location = useLocation();
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [modalMessage, setModalMessage] = useState('');
  const dropdownRef = useRef(null);
  const priorityDropdownRef = useRef(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [localPagination, setLocalPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 1
  });
  
  // Get view type from URL
  const showFavoritesOnly = location.pathname === '/favorites';
  const isMyNotifications = location.pathname === '/my-notifications';

  // Update local state when path changes
  useEffect(() => {
    // Reset to page 1 when changing views
    setCurrentPage(1);
  }, [location.pathname]);

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300); // 300ms delay
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);
  
  // Determine which query to use based on whether we have a search term
  const useSearchQuery = debouncedSearchTerm.trim().length > 0;
  
  // Determine if we should use server-side pagination or client-side pagination
  // Use client-side pagination for filtered views (favorites, unread)
  const useClientPagination = showFavoritesOnly || 
                             filter === 'unread' ||
                             selectedCategories.length > 0 ||
                             selectedPriorities.length > 0;
  
  // RTK Query hooks
  const { data = {}, isLoading: notificationsLoading } = useGetNotificationsQuery(
    // For client-side pagination, request all items by setting a high limit
    { 
      my: isMyNotifications,
      page: useClientPagination ? 1 : currentPage,
      limit: useClientPagination ? 100 : 10 // Request more items for client-side pagination
    },
    { 
      pollingInterval: useSearchQuery ? 0 : POLLING_INTERVAL, // Disable polling during search
      skip: useSearchQuery
    }
  );
  
  const notifications = data.notifications || [];
  const pagination = data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };
  
  const { data: searchData = {}, isLoading: searchLoading } = useSearchNotificationsQuery(
    debouncedSearchTerm ? { 
      query: debouncedSearchTerm, 
      page: useClientPagination ? 1 : currentPage,
      limit: useClientPagination ? 100 : 10 // Request more items for client-side pagination
    } : undefined,
    { skip: !useSearchQuery }
  );
  
  const searchResults = searchData.notifications || [];
  const searchPagination = searchData.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };
  
  const { data: favoritesData = [] } = useGetFavoritesQuery(undefined, 
    { pollingInterval: POLLING_INTERVAL }
  );
  
  const { 
    data: readStatusData = [], 
    isSuccess: readStatusSuccess 
  } = useGetReadStatusQuery();
  
  const [deleteNotification] = useDeleteNotificationMutation();
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();
  const [markAsRead] = useMarkAsReadMutation();

  // Use search results if we're searching, otherwise use regular notifications
  const currentNotifications = useSearchQuery ? searchResults : notifications;
  const isLoading = useSearchQuery ? searchLoading : notificationsLoading;

  // Calculate read status
  const readStatus = useMemo(() => 
    calculateReadStatus(currentNotifications, readStatusData, readStatusSuccess),
    [currentNotifications, readStatusData, readStatusSuccess]
  );

  // Combine dropdown outside click logic
  useEffect(() => {
    if (!dropdownOpen && !priorityDropdownOpen) return;
    function handleClickOutside(event) {
      if (dropdownOpen && dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
      if (priorityDropdownOpen && priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target)) {
        setPriorityDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen, priorityDropdownOpen]);

  const handleDelete = async (id) => {
    setModalMessage('Oled kindel, et soovid selle teate kustutada?');
    setModalAction(() => async () => {
      try {
        await deleteNotification(id).unwrap();
      } catch (err) {
        console.error('Viga kustutamisel:', err);
      }
      setModalOpen(false);
    });
    setModalOpen(true);
  };

  const toggleFavorite = async (notificationId) => {
    try {
      if (favoritesData.some(f => f.notification_id === notificationId)) {
        await removeFavorite(notificationId).unwrap();
        if (onFavoritesChange) onFavoritesChange();
      } else {
        await addFavorite(notificationId).unwrap();
        if (onFavoritesChange) onFavoritesChange();
      }
    } catch (err) {
      console.error('Viga lemmiku lisamisel/eemaldamisel:', err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId).unwrap();
      if (onUnreadChange) onUnreadChange();
    } catch (err) {
      console.error('Viga teate lugemise märkimisel:', err);
    }
  };

  // Current pagination - either from server or local
  const currentPagination = useClientPagination 
    ? localPagination 
    : (useSearchQuery ? searchPagination : pagination);
  
  // Handle page change
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= currentPagination.totalPages) {
      if (useClientPagination) {
        // For client-side pagination, just update local state
        setLocalPagination(prev => ({ ...prev, page: newPage }));
      } else {
        // For server-side pagination, fetch new page
        setCurrentPage(newPage);
      }
      // Scroll to top when changing pages
      window.scrollTo(0, 0);
    }
  };

  // Memoize filtered notifications
  const allFilteredNotifications = useMemo(() => {
    if (isLoading) return [];
    
    let result = [...currentNotifications];
    
    // For search results we don't need to filter by path condition as the API already handles that
    if (!useSearchQuery) {
      // If we're already fetching my notifications from the API, no need to filter again
      // Otherwise, apply my notifications filter if enabled through path
      if (location.pathname === '/my-notifications') {
        result = result.filter(n => n.created_by === user?.id);
      }
    }
    
    // Apply favorites filter if enabled via path
    if (location.pathname === '/favorites') {
      result = result.filter(n => favoritesData.some(f => f.notification_id === n.id));
    }
    
    // Apply unread filter if enabled
    if (filter === 'unread') {
      // For new users, all notifications are considered unread
      if (!readStatusData || readStatusData.length === 0) {
        // Leave all notifications in the array (they're all unread)
      } else {
        // Otherwise filter by read status
        result = result.filter(n => readStatus[n.id] === false);
      }
    }
    
    // Apply priority filters
    if (selectedPriorities.length > 0) {
      result = result.filter(n => selectedPriorities.includes(n.priority));
    }
    
    // Apply category filters
    if (selectedCategories.length > 0) {
      result = result.filter(n => selectedCategories.includes(n.category));
    }
    
    return result;
  }, [
    currentNotifications, 
    favoritesData, 
    filter, 
    readStatus, 
    selectedPriorities, 
    selectedCategories, 
    user, 
    location.pathname,
    isLoading,
    readStatusData,
    useSearchQuery
  ]);

  // Apply client-side pagination if needed
  const filteredNotifications = useMemo(() => {
    // Update local pagination totals
    if (useClientPagination) {
      const total = allFilteredNotifications.length;
      const totalPages = Math.max(1, Math.ceil(total / 10));
      
      // Only update if values have changed to prevent re-renders
      if (total !== localPagination.total || totalPages !== localPagination.totalPages) {
        setLocalPagination(prev => ({
          ...prev,
          total,
          totalPages,
          // Adjust page if the current page is now beyond the max
          page: Math.min(prev.page, totalPages)
        }));
      }
      
      // Apply client-side pagination
      const startIndex = (localPagination.page - 1) * 10;
      return allFilteredNotifications.slice(startIndex, startIndex + 10);
    }
    
    // Otherwise use the filtered notifications as-is (server pagination)
    return allFilteredNotifications;
  }, [allFilteredNotifications, useClientPagination, localPagination.page, localPagination.total, localPagination.totalPages]);

  // Calculate filtered unread count for all items (not just current page)
  const totalUnreadCount = useMemo(() => {
    // For regular view, use the same calculation as the sidebar
    if (!useClientPagination && !useSearchQuery && filter !== 'unread' && 
        !showFavoritesOnly && location.pathname !== '/favorites' && 
        selectedCategories.length === 0 && selectedPriorities.length === 0) {
      
      // For new users with no readStatusData, all notifications are unread
      const totalNotifications = currentPagination.total || 0;
      if (totalNotifications > 0 && (!readStatusData || readStatusData.length === 0)) {
        return totalNotifications; // If no read status data, all notifications are unread
      }
      
      // If we have total from pagination metadata but don't have all notifications loaded
      if (totalNotifications > notifications.length && readStatusData && readStatusData.length > 0) {
        // Calculate the number of notifications that have a read status
        const readNotifications = readStatusData.filter(item => item.read).length;
        // Unread count is total notifications minus read notifications
        return totalNotifications - readNotifications;
      }
    }
    
    // For filtered views, calculate based on all filtered items
    return allFilteredNotifications.filter(n => readStatus[n.id] === false).length;
  }, [
    useClientPagination, 
    useSearchQuery, 
    filter, 
    showFavoritesOnly, 
    location.pathname, 
    selectedCategories.length, 
    selectedPriorities.length, 
    currentPagination.total,
    notifications.length,
    readStatusData,
    allFilteredNotifications, 
    readStatus
  ]);

  // Debug pagination
  useEffect(() => {
    if (useClientPagination && allFilteredNotifications.length > 10) {
      console.log('Client-side pagination enabled:', {
        totalItems: allFilteredNotifications.length,
        localPagination,
        visibleItems: filteredNotifications.length,
        shouldShowControls: localPagination.totalPages > 1
      });
    }
  }, [useClientPagination, allFilteredNotifications.length, filteredNotifications.length, localPagination]);

  // Get filter description using helper function
  const filterDescriptionText = useMemo(() => 
    getFilterDescription(isMyNotifications, showFavoritesOnly, filter, location.pathname, selectedCategories, selectedPriorities, searchTerm),
    [isMyNotifications, showFavoritesOnly, filter, location.pathname, selectedCategories, selectedPriorities, searchTerm]
  );

  if (isLoading) {
    return <div className="loading-message">Laen...</div>;
  }

  return (
    <div className="notification-list">
      <div className="header-section">
        <h2>{getPageTitle(isMyNotifications, showFavoritesOnly, filter, location.pathname)}</h2>
        <NotificationFilters
          selectedCategories={selectedCategories}
          setSelectedCategories={setSelectedCategories}
          selectedPriorities={selectedPriorities}
          setSelectedPriorities={setSelectedPriorities}
          dropdownOpen={dropdownOpen}
          setDropdownOpen={setDropdownOpen}
          priorityDropdownOpen={priorityDropdownOpen}
          setPriorityDropdownOpen={setPriorityDropdownOpen}
          dropdownRef={dropdownRef}
          priorityDropdownRef={priorityDropdownRef}
          filteredCount={useClientPagination ? localPagination.total : currentPagination.total}
          filterDescription={filterDescriptionText}
          unreadCount={totalUnreadCount}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />
      </div>
      
      {filteredNotifications.length === 0 ? (
        <EmptyNotifications 
          showFavoritesOnly={showFavoritesOnly} 
          filter={filter} 
          isMyNotifications={isMyNotifications} 
          pathname={location.pathname} 
          hasSearch={!!searchTerm.trim()}
        />
      ) : (
        <>
          <div className="notification-list-info">
            {useClientPagination ? (
              <div className="total-count">
                Kokku: {localPagination.total} teadet 
                {localPagination.totalPages > 1 && ` (lehekülg ${localPagination.page}/${localPagination.totalPages})`}
              </div>
            ) : (
              currentPagination.total > 0 && (
                <div className="total-count">
                  Kokku: {currentPagination.total} teadet 
                  {currentPagination.totalPages > 1 && ` (lehekülg ${currentPagination.page}/${currentPagination.totalPages})`}
                </div>
              )
          )}
        </div>
        <ul className="notifications">
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
                userRole={user?.role}
                userId={user?.id}
              readStatus={readStatus}
                onMarkAsRead={handleMarkAsRead}
              onToggleFavorite={toggleFavorite}
                onDelete={(isMyNotifications || location.pathname === '/my-notifications') ? handleDelete : null}
                isFavorite={favoritesData.some(f => f.notification_id === notification.id)}
            />
          ))}
        </ul>
          
          {/* Use more reliable condition here to always show pagination when needed */}
          {(useClientPagination ? 
            // For client-side, show if we have more than 10 total items 
            allFilteredNotifications.length > 10 : 
            // For server-side, use the server's total pages
            currentPagination.totalPages > 1) && (
            <div className="pagination-controls">
              <button 
                className="pagination-button"
                onClick={() => handlePageChange(1)}
                disabled={useClientPagination ? localPagination.page === 1 : currentPagination.page === 1}
              >
                &laquo;
              </button>
              <button 
                className="pagination-button"
                onClick={() => handlePageChange(useClientPagination ? localPagination.page - 1 : currentPagination.page - 1)}
                disabled={useClientPagination ? localPagination.page === 1 : currentPagination.page === 1}
              >
                &lsaquo;
              </button>
              
              <div className="pagination-info">
                {useClientPagination ? localPagination.page : currentPagination.page} / {useClientPagination ? localPagination.totalPages : currentPagination.totalPages}
              </div>
              
              <button 
                className="pagination-button"
                onClick={() => handlePageChange(useClientPagination ? localPagination.page + 1 : currentPagination.page + 1)}
                disabled={useClientPagination ? localPagination.page === localPagination.totalPages : currentPagination.page === currentPagination.totalPages}
              >
                &rsaquo;
              </button>
              <button 
                className="pagination-button"
                onClick={() => handlePageChange(useClientPagination ? localPagination.totalPages : currentPagination.totalPages)}
                disabled={useClientPagination ? localPagination.page === localPagination.totalPages : currentPagination.page === currentPagination.totalPages}
              >
                &raquo;
              </button>
            </div>
          )}
        </>
      )}
      <ConfirmationModal
        open={modalOpen}
        title="Kustutamine"
        message={modalMessage}
        confirmText="Kustuta"
        cancelText="Tühista"
        onConfirm={modalAction}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
};

export default NotificationList;
