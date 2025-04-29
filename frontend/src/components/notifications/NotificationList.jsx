// src/components/NotificationList.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './styles/NotificationList.css';
import NotificationItem from './NotificationItem';
import MultiSelectDropdown from './MultiSelectDropdown';
import {
  useGetNotificationsQuery,
  useGetFavoritesQuery,
  useGetReadStatusQuery,
  useDeleteNotificationMutation,
  useAddFavoriteMutation,
  useRemoveFavoriteMutation,
  useMarkAsReadMutation
} from '../../services/api';

const POLLING_INTERVAL = 5000; // Poll every 5 seconds

// ConfirmationModal component
const ConfirmationModal = ({ open, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal">
        <p>{message}</p>
        <div className="custom-modal-actions">
          <button className="custom-modal-confirm" onClick={onConfirm}>Kinnita</button>
          <button className="custom-modal-cancel" onClick={onCancel}>Tühista</button>
        </div>
      </div>
    </div>
  );
};

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
  
  // Console log for debugging
  console.log('NotificationList props:', { showFavoritesOnly, filter, showMyNotifications, pathname: location.pathname });

  // Set filter from location path
  useEffect(() => {
    if (location.pathname === '/favorites') {
      showFavoritesOnly = true;
    } else if (location.pathname === '/my-notifications') {
      showMyNotifications = true;
    }
  }, [location.pathname]);

  // RTK Query hooks
  const { data: notifications = [], isLoading: notificationsLoading } = useGetNotificationsQuery(
    { my: showMyNotifications },
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

  // Debug logging for read status
  useEffect(() => {
    console.log("Read status data:", { 
      readStatusData, 
      readStatusSuccess,
      notificationCount: notifications?.length || 0
    });
  }, [readStatusData, readStatusSuccess, notifications]);

  // Format read status data - ALL notifications are unread for new users by default
  const readStatus = useMemo(() => {
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
  }, [readStatusData, notifications, readStatusSuccess]);

  // Calculate unread count
  const unreadCount = useMemo(() => {
    if (notificationsLoading) return 0;
    
    // For new users with no readStatusData, all notifications are unread
    if (notifications.length > 0 && (!readStatusData || readStatusData.length === 0)) {
      return notifications.length;
    }
    
    // Otherwise count notifications marked as not read in readStatus
    return notifications.filter(n => readStatus[n.id] === false).length;
  }, [notifications, readStatus, notificationsLoading, readStatusData]);

  const categories = useMemo(() => [
    { value: 'õppetöö', label: 'Õppetöö' },
    { value: 'hindamine', label: 'Hindamine' },
    { value: 'praktika', label: 'Praktika' },
    { value: 'stipendium', label: 'Stipendium' },
    { value: 'sündmused', label: 'Sündmused' },
    { value: 'erakorralised', label: 'Erakorralised' },
    { value: 'muu', label: 'Muu' },
  ], []);

  const priorities = useMemo(() => [
    { value: 'kiire', label: 'Kiire' },
    { value: 'kõrge', label: 'Kõrge' },
    { value: 'tavaline', label: 'Tavaline' },
    { value: 'madal', label: 'Madal' },
  ], []);

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
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
    
    // Apply my notifications filter if enabled
    if (showMyNotifications || location.pathname === '/my-notifications') {
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
    showMyNotifications, 
    user, 
    location.pathname,
    notificationsLoading,
    readStatusData
  ]);

  // Calculate filtered unread count
  const filteredUnreadCount = useMemo(() => {
    return filteredNotifications.filter(n => readStatus[n.id] === false).length;
  }, [filteredNotifications, readStatus]);

  const getPageTitle = () => {
    if (showMyNotifications || location.pathname === '/my-notifications') 
      return 'Minu teated';
    if (showFavoritesOnly || location.pathname === '/favorites') 
      return 'Lemmikud';
    if (filter === 'unread') 
      return 'Lugemata teated';
    return 'Teated';
  };

  // Get the current filter description
  const getFilterDescription = () => {
    let description = [];

    if (showMyNotifications || location.pathname === '/my-notifications')
      description.push('Minu teated');
    else if (showFavoritesOnly || location.pathname === '/favorites')
      description.push('Lemmikud');
    else if (filter === 'unread')
      description.push('Lugemata');

    if (selectedCategories.length > 0) {
      if (selectedCategories.length === 1) {
        description.push(`Kategooria: ${categories.find(c => c.value === selectedCategories[0])?.label || selectedCategories[0]}`);
      } else {
        description.push(`${selectedCategories.length} kategooriat`);
      }
    }

    if (selectedPriorities.length > 0) {
      if (selectedPriorities.length === 1) {
        description.push(`Prioriteet: ${priorities.find(p => p.value === selectedPriorities[0])?.label || selectedPriorities[0]}`);
      } else {
        description.push(`${selectedPriorities.length} prioriteeti`);
      }
    }

    return description.length > 0 ? description.join(', ') : 'Kõik teated';
  };

  if (notificationsLoading) {
    return <div className="loading-message">Laen...</div>;
  }

  return (
    <div className="notification-list">
      <div className="header-section">
        <h2>{getPageTitle()}</h2>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="notification-count">
              <span className="filter-description">{getFilterDescription()}</span>
              <span className="count">{filteredNotifications.length}</span>
              {filteredUnreadCount > 0 && (
                <span className="unread-badge" title="Lugemata teateid">{filteredUnreadCount}</span>
              )}
            </div>
          </div>
          <MultiSelectDropdown
            open={dropdownOpen}
            setOpen={setDropdownOpen}
            options={categories}
            selected={selectedCategories}
            setSelected={setSelectedCategories}
            buttonLabel="Vali kategooriad"
            dropdownRef={dropdownRef}
          />
          <MultiSelectDropdown
            open={priorityDropdownOpen}
            setOpen={setPriorityDropdownOpen}
            options={priorities}
            selected={selectedPriorities}
            setSelected={setSelectedPriorities}
            buttonLabel="Vali prioriteedid"
            dropdownRef={priorityDropdownRef}
          />
        </div>
      </div>
      {filteredNotifications.length === 0 ? (
        <div className="no-notifications">
          {showFavoritesOnly || location.pathname === '/favorites' ? (
            <p>Lemmikute nimekiri on tühi</p>
          ) : filter === 'unread' ? (
            <p>Lugemata teateid ei ole</p>
          ) : showMyNotifications || location.pathname === '/my-notifications' ? (
            <p>Te ei ole veel ühtegi teadet loonud</p>
          ) : (
            <p>Teateid ei ole</p>
          )}
        </div>
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
              onDelete={(showMyNotifications || location.pathname === '/my-notifications') ? handleDelete : null}
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
