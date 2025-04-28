// src/components/NotificationList.jsx
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { notificationService } from '../../services/notificationService';
import NotificationCard from '../common/NotificationCard';
import './styles/NotificationList.css';

const NotificationList = ({ showFavoritesOnly = false, filter = 'all', onUnreadChange }) => {
  const { userRole, userId } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [priorityFilter, setPriorityFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
    // Poll for new notifications every 10 seconds
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [userRole]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [notificationsData, favoritesData] = await Promise.all([
        notificationService.getAll(),
        userRole === 'student' ? notificationService.getFavorites() : Promise.resolve([])
      ]);
      
      setNotifications(notificationsData);
      setFavorites(favoritesData);
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFavorite = async (notificationId) => {
    try {
      const isFavorite = favorites.some(f => f.notification_id === notificationId);
      if (isFavorite) {
        await notificationService.removeFavorite(notificationId);
        setFavorites(favorites.filter(f => f.notification_id !== notificationId));
      } else {
        await notificationService.toggleFavorite(notificationId);
        const updatedNotification = await notificationService.getById(notificationId);
        setFavorites([...favorites, { notification_id: notificationId, notification: updatedNotification }]);
      }
    } catch (err) {
      console.error('Failed to toggle favorite:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationService.delete(id);
      setNotifications(notifications.filter(n => n.id !== id));
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
      if (onUnreadChange) onUnreadChange();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const displayedNotifications = showFavoritesOnly
    ? notifications.filter(n => favorites.some(f => f.notification_id === n.id))
    : notifications;

  const filteredNotifications = displayedNotifications.filter(n => {
    if (priorityFilter && n.priority !== priorityFilter) return false;
    return true;
  });

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div className="notification-list">
      <div className="header-section">
        <h2>Teated</h2>
        <div className="filters">
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="priority-filter"
          >
            <option value="">Kõik prioriteedid</option>
            <option value="kiire">Kiire</option>
            <option value="kõrge">Kõrge</option>
            <option value="tavaline">Tavaline</option>
            <option value="madal">Madal</option>
          </select>
          {userRole === 'programmijuht' && (
            <button 
              onClick={() => navigate('/add')} 
              className="add-button"
            >
              Lisa uus teade
            </button>
          )}
        </div>
      </div>

      {filteredNotifications.length === 0 ? (
        <p className="empty-message">Ühtegi teadet ei ole.</p>
      ) : (
        <div className="notifications-grid">
          {filteredNotifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              isFavorite={favorites.some(f => f.notification_id === notification.id)}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDelete}
              userRole={userRole}
              userId={userId}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationList;
