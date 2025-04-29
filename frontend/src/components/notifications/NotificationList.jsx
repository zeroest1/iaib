// src/components/NotificationList.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './styles/NotificationList.css';
import NotificationItem from './NotificationItem';
import NotificationFilters from './NotificationFilters';
import EmptyNotifications from './EmptyNotifications';
import ConfirmationModal from './ConfirmationModal';
import { POLLING_INTERVAL } from './constants';
import {
  calculateReadStatus,
  calculateUnreadCount,
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
  useMarkAsReadMutation
} from '../../services/api';

const NotificationList = ({ showFavoritesOnly = false, favorites = [], onFavoritesChange, filter = 'all', onUnreadChange, showMyNotifications = false }) => {
  const { user } = useSelector(state => state.auth);
  const location = useLocation();
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [modalMessage, setModalMessage] = useState('');
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const priorityDropdownRef = useRef(null);
  
  // Set local state based on path
  const [isMyNotifications, setIsMyNotifications] = useState(showMyNotifications || location.pathname === '/my-notifications');
  
  // Update local state when path changes
  useEffect(() => {
    setIsMyNotifications(showMyNotifications || location.pathname === '/my-notifications');
  }, [location.pathname, showMyNotifications]);

  // RTK Query hooks
  const { data: notifications = [], isLoading: notificationsLoading } = useGetNotificationsQuery(
    { my: isMyNotifications },
    { pollingInterval: POLLING_INTERVAL }
  );
  const { data: favoritesData = [] } = useGetFavoritesQuery(undefined, 
    { pollingInterval: POLLING_INTERVAL }
  );
  const { 
    data: readStatusData = [], 
    isLoading: readStatusLoading,
    isSuccess: readStatusSuccess 
  } = useGetReadStatusQuery();
  const [deleteNotification] = useDeleteNotificationMutation();
  const [addFavorite] = useAddFavoriteMutation();
  const [removeFavorite] = useRemoveFavoriteMutation();
  const [markAsRead] = useMarkAsReadMutation();

  // Calculate read status
  const readStatus = useMemo(() => 
    calculateReadStatus(notifications, readStatusData, readStatusSuccess),
    [notifications, readStatusData, readStatusSuccess]
  );

  // Calculate unread count
  const unreadCount = useMemo(() => 
    calculateUnreadCount(notifications, readStatus, notificationsLoading, readStatusData),
    [notifications, readStatus, notificationsLoading, readStatusData]
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

  // Memoize filtered notifications
  const filteredNotifications = useMemo(() => {
    if (notificationsLoading) return [];
    
    let result = [...notifications];
    
    // If we're already fetching my notifications from the API, no need to filter again
    // Otherwise, apply my notifications filter if enabled through UI actions
    if (!isMyNotifications && location.pathname === '/my-notifications') {
      result = result.filter(n => n.created_by === user?.id);
    }
    
    // Apply favorites filter if enabled
    if (showFavoritesOnly || location.pathname === '/favorites') {
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
    notifications, 
    favoritesData, 
    showFavoritesOnly, 
    filter, 
    readStatus, 
    selectedPriorities, 
    selectedCategories, 
    isMyNotifications, 
    user, 
    location.pathname,
    notificationsLoading,
    readStatusData
  ]);

  // Calculate filtered unread count
  const filteredUnreadCount = useMemo(() => {
    return filteredNotifications.filter(n => readStatus[n.id] === false).length;
  }, [filteredNotifications, readStatus]);

  // Get filter description using helper function
  const filterDescriptionText = useMemo(() => 
    getFilterDescription(isMyNotifications, showFavoritesOnly, filter, location.pathname, selectedCategories, selectedPriorities),
    [isMyNotifications, showFavoritesOnly, filter, location.pathname, selectedCategories, selectedPriorities]
  );

  if (notificationsLoading) {
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
          filteredCount={filteredNotifications.length}
          filterDescription={filterDescriptionText}
          unreadCount={filteredUnreadCount}
        />
      </div>
      
      {filteredNotifications.length === 0 ? (
        <EmptyNotifications 
          showFavoritesOnly={showFavoritesOnly} 
          filter={filter} 
          isMyNotifications={isMyNotifications} 
          pathname={location.pathname} 
        />
      ) : (
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
      )}
      <ConfirmationModal
        open={modalOpen}
        message={modalMessage}
        onConfirm={modalAction}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
};

export default NotificationList;
