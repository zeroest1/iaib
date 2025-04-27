// src/components/NotificationList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './NotificationList.css';

const NotificationList = ({ showFavoritesOnly = false, favorites = [], onFavoritesChange, filter = 'all', onUnreadChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [favoritesList, setFavoritesList] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [readStatus, setReadStatus] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserRole();
    fetchNotifications();
    if (userRole === 'student') {
      fetchFavorites();
    }
    fetchReadStatus();
    // Poll for new notifications every 10 seconds
    const interval = setInterval(() => {
      fetchNotifications();
      if (userRole === 'student') {
        fetchFavorites();
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [userRole, navigate]);

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserRole(res.data.role);
      setUserId(res.data.id);
    } catch (err) {
      localStorage.removeItem('token');
      navigate('/login');
      console.error('Viga kasutaja rolli laadimisel:', err);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Viga teadete laadimisel:', err);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/favorites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavoritesList(res.data);
    } catch (err) {
      console.error('Viga lemmikute laadimisel:', err);
    }
  };

  const fetchReadStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:5000/api/notifications/read-status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReadStatus(res.data.reduce((acc, curr) => {
        acc[curr.notification_id] = curr.read;
        return acc;
      }, {}));
    } catch (err) {
      setReadStatus({});
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/notifications/${id}`);
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Viga kustutamisel:', err);
    }
  };

  const toggleFavorite = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (favoritesList.some(f => f.notification_id === notificationId)) {
        await axios.delete(`http://localhost:5000/api/favorites/${notificationId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavoritesList(favoritesList.filter(f => f.notification_id !== notificationId));
        if (onFavoritesChange) onFavoritesChange();
      } else {
        await axios.post('http://localhost:5000/api/favorites', { notificationId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const res = await axios.get(`http://localhost:5000/api/notifications/${notificationId}`);
        setFavoritesList([...favoritesList, { notification_id: notificationId, notification: res.data }]);
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

  const displayedNotifications = showFavoritesOnly
    ? notifications.filter(n => favoritesList.some(f => f.notification_id === n.id))
    : notifications;

  const markAsRead = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`http://localhost:5000/api/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReadStatus(prev => ({ ...prev, [notificationId]: true }));
      if (onUnreadChange) onUnreadChange();
    } catch (err) {}
  };

  let filteredNotifications = displayedNotifications;
  if (filter === 'unread') {
    filteredNotifications = displayedNotifications.filter(n => !readStatus[n.id]);
  }

  return (
    <div className="notification-list">
      <div className="header-section">
        <h2>Teated</h2>
        {userRole === 'programmijuht' && (
          <button 
            onClick={() => navigate('/add')} 
            className="add-button"
          >
            Lisa uus teade
          </button>
        )}
      </div>

      {filteredNotifications.length === 0 ? (
        <p className="empty-message">
          Ühtegi teadet ei ole.
        </p>
      ) : (
        <ul>
          {filteredNotifications.map((notification) => (
            <li key={notification.id} className={`notification-item${readStatus[notification.id] ? ' read' : ' unread'}`} data-priority={notification.priority}>
              <div className="notification-content">
                <Link to={`/notifications/${notification.id}`} className="notification-link" onClick={(e) => { if (userRole === 'student') { markAsRead(notification.id); } }}>
                  <h3>{notification.title}</h3>
                  <p className="excerpt">{notification.content.slice(0, 100)}{notification.content.length > 100 ? '...' : ''}</p>
                  {notification.excerpt && <p className="excerpt">{notification.excerpt}</p>}
                  <p className="creator">Autor: {notification.creator_name}</p>
                </Link>
                {userRole === 'student' && (
                  <button
                    className={`favorite-button ${favoritesList.some(f => f.notification_id === notification.id) ? 'active' : ''}`}
                    onClick={() => toggleFavorite(notification.id)}
                  >
                    {favoritesList.some(f => f.notification_id === notification.id) ? '★' : '☆'}
                  </button>
                )}
                {userRole === 'programmijuht' && notification.created_by === userId && (
                  <button 
                    onClick={() => handleDelete(notification.id)} 
                    className="delete-button"
                  >
                    Kustuta
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationList;
