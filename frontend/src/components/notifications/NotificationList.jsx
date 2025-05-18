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
  
  const showFavoritesOnly = location.pathname === '/favorites';
  const isMyNotifications = location.pathname === '/my-notifications';

  useEffect(() => {
    setCurrentPage(1);
  }, [location.pathname]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    
    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);
  
  const useSearchQuery = debouncedSearchTerm.trim().length > 0;
  
  const useClientPagination = showFavoritesOnly || 
                             filter === 'unread' ||
                             selectedCategories.length > 0 ||
                             selectedPriorities.length > 0;
  
  const { data = {}, isLoading: notificationsLoading } = useGetNotificationsQuery(
    { 
      my: isMyNotifications,
      page: useClientPagination ? 1 : currentPage,
      limit: useClientPagination ? 100 : 10
    },
    { 
      pollingInterval: useSearchQuery ? 0 : POLLING_INTERVAL,
      skip: useSearchQuery
    }
  );
  
  const notifications = data.notifications || [];
  const pagination = data.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 };
  
  const { data: searchData = {}, isLoading: searchLoading } = useSearchNotificationsQuery(
    debouncedSearchTerm ? { 
      query: debouncedSearchTerm, 
      page: useClientPagination ? 1 : currentPage,
      limit: useClientPagination ? 100 : 10
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

  const currentNotifications = useSearchQuery ? searchResults : notifications;
  const isLoading = useSearchQuery ? searchLoading : notificationsLoading;

  const readStatus = useMemo(() => 
    calculateReadStatus(currentNotifications, readStatusData, readStatusSuccess),
    [currentNotifications, readStatusData, readStatusSuccess]
  );

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
        setModalMessage(`Viga teate kustutamisel: ${err.message || 'Midagi läks valesti'}`);
        setModalOpen(true);
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
      setModalMessage(`Viga lemmiku lisamisel/eemaldamisel: ${err.message || 'Midagi läks valesti'}`);
      setModalOpen(true);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markAsRead(notificationId).unwrap();
      if (onUnreadChange) onUnreadChange();
    } catch (err) {
      setModalMessage(`Viga teate lugemise märkimisel: ${err.message || 'Midagi läks valesti'}`);
      setModalOpen(true);
    }
  };

  const currentPagination = useClientPagination 
    ? localPagination 
    : (useSearchQuery ? searchPagination : pagination);
  
  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= currentPagination.totalPages) {
      if (useClientPagination) {
        setLocalPagination(prev => ({ ...prev, page: newPage }));
      } else {
        setCurrentPage(newPage);
      }
    }
  };

  const allFilteredNotifications = useMemo(() => {
    if (isLoading) return [];
    
    let result = [...currentNotifications];
    
    if (!useSearchQuery) {
      if (location.pathname === '/my-notifications') {
        result = result.filter(n => n.created_by === user?.id);
      }
    }
    
    if (location.pathname === '/favorites') {
      result = result.filter(n => favoritesData.some(f => f.notification_id === n.id));
    }
    
    if (filter === 'unread') {
      if (!readStatusData || readStatusData.length === 0) {
        // Leave all notifications in the array (they're all unread)
      } else {
        result = result.filter(n => readStatus[n.id] === false);
      }
    }
    
    if (selectedPriorities.length > 0) {
      result = result.filter(n => selectedPriorities.includes(n.priority));
    }
    
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

  const filteredNotifications = useMemo(() => {
    if (useClientPagination) {
      const total = allFilteredNotifications.length;
      const totalPages = Math.max(1, Math.ceil(total / 10));
      
      if (total !== localPagination.total || totalPages !== localPagination.totalPages) {
        setLocalPagination(prev => ({
          ...prev,
          total,
          totalPages,
          page: Math.min(prev.page, totalPages)
        }));
      }
      
      const startIndex = (localPagination.page - 1) * 10;
      return allFilteredNotifications.slice(startIndex, startIndex + 10);
    }
    
    return allFilteredNotifications;
  }, [allFilteredNotifications, useClientPagination, localPagination.page, localPagination.total, localPagination.totalPages]);

  const totalUnreadCount = useMemo(() => {
    if (!useClientPagination && !useSearchQuery && filter !== 'unread' && 
        !showFavoritesOnly && location.pathname !== '/favorites' && 
        selectedCategories.length === 0 && selectedPriorities.length === 0) {
      
      const totalNotifications = currentPagination.total || 0;
      if (totalNotifications > 0 && (!readStatusData || readStatusData.length === 0)) {
        return totalNotifications;
      }
      
      if (totalNotifications > notifications.length && readStatusData && readStatusData.length > 0) {
        const readNotifications = readStatusData.filter(item => item.read).length;
        return totalNotifications - readNotifications;
      }
    }
    
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
          
          {(useClientPagination ? 
            allFilteredNotifications.length > 10 : 
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
