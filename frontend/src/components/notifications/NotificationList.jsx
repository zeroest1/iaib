// src/components/NotificationList.jsx
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './styles/NotificationList.css';
import { API_BASE_URL } from '../../config/api';

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

const NotificationList = ({ showFavoritesOnly = false, favorites = [], onFavoritesChange, filter = 'all', onUnreadChange }) => {
  const [notifications, setNotifications] = useState([]);
  const [favoritesList, setFavoritesList] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [userRole, setUserRole] = useState(null);
  const [userId, setUserId] = useState(null);
  const [readStatus, setReadStatus] = useState({});
  const [priorityDropdownOpen, setPriorityDropdownOpen] = useState(false);
  const [selectedPriorities, setSelectedPriorities] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [modalMessage, setModalMessage] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const priorityDropdownRef = useRef(null);

  const categories = [
    { value: 'õppetöö', label: 'Õppetöö' },
    { value: 'hindamine', label: 'Hindamine' },
    { value: 'praktika', label: 'Praktika' },
    { value: 'stipendium', label: 'Stipendium' },
    { value: 'sündmused', label: 'Sündmused' },
    { value: 'erakorralised', label: 'Erakorralised' },
    { value: 'muu', label: 'Muu' },
  ];

  const priorities = [
    { value: 'kiire', label: 'Kiire' },
    { value: 'kõrge', label: 'Kõrge' },
    { value: 'tavaline', label: 'Tavaline' },
    { value: 'madal', label: 'Madal' },
  ];

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
    }, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [userRole, navigate]);

  useEffect(() => {
    if (!dropdownOpen) return;
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (!priorityDropdownOpen) return;
    function handleClickOutside(event) {
      if (priorityDropdownRef.current && !priorityDropdownRef.current.contains(event.target)) {
        setPriorityDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [priorityDropdownOpen]);

  const fetchUserRole = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/auth/me`, {
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
      const res = await axios.get(`${API_BASE_URL}/notifications`);
      setNotifications(res.data);
    } catch (err) {
      console.error('Viga teadete laadimisel:', err);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/favorites`, {
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
      const res = await axios.get(`${API_BASE_URL}/notifications/read-status`, {
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
    setModalMessage('Oled kindel, et soovid selle teate kustutada?');
    setDeleteId(id);
    setModalAction(() => async () => {
      try {
        await axios.delete(`${API_BASE_URL}/notifications/${id}`);
        setNotifications(notifications.filter((n) => n.id !== id));
      } catch (err) {
        console.error('Viga kustutamisel:', err);
      }
      setModalOpen(false);
    });
    setModalOpen(true);
  };

  const toggleFavorite = async (notificationId) => {
    try {
      const token = localStorage.getItem('token');
      if (favoritesList.some(f => f.notification_id === notificationId)) {
        await axios.delete(`${API_BASE_URL}/favorites/${notificationId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setFavoritesList(favoritesList.filter(f => f.notification_id !== notificationId));
        if (onFavoritesChange) onFavoritesChange();
      } else {
        await axios.post(`${API_BASE_URL}/favorites`, { notificationId }, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const res = await axios.get(`${API_BASE_URL}/notifications/${notificationId}`);
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
      await axios.post(`${API_BASE_URL}/notifications/${notificationId}/read`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setReadStatus(prev => ({ ...prev, [notificationId]: true }));
      if (onUnreadChange) onUnreadChange();
    } catch (err) {}
  };

  return (
    <div className="notification-list">
      <div className="header-section">
        <h2>Teated</h2>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
          <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="category-dropdown-btn"
            >
              Vali kategooriad
              <span style={{ marginLeft: 8 }}>▼</span>
            </button>
            {dropdownOpen && (
              <div className="category-dropdown-menu">
                <label style={{ fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={selectedCategories.length === 0}
                    onChange={() => setSelectedCategories([])}
                  />
                  Kõik
                </label>
                {categories.map(cat => (
                  <label key={cat.value}>
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(cat.value)}
                      onChange={() => {
                        if (selectedCategories.includes(cat.value)) {
                          setSelectedCategories(selectedCategories.filter(c => c !== cat.value));
                        } else {
                          setSelectedCategories([...selectedCategories, cat.value]);
                        }
                      }}
                    />
                    {cat.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <div style={{ position: 'relative', display: 'inline-block' }} ref={priorityDropdownRef}>
            <button
              onClick={() => setPriorityDropdownOpen(!priorityDropdownOpen)}
              className="category-dropdown-btn"
            >
              Vali prioriteedid
              <span style={{ marginLeft: 8 }}>▼</span>
            </button>
            {priorityDropdownOpen && (
              <div className="category-dropdown-menu">
                <label style={{ fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={selectedPriorities.length === 0}
                    onChange={() => setSelectedPriorities([])}
                  />
                  Kõik
                </label>
                {priorities.map(pri => (
                  <label key={pri.value}>
                    <input
                      type="checkbox"
                      checked={selectedPriorities.includes(pri.value)}
                      onChange={() => {
                        if (selectedPriorities.includes(pri.value)) {
                          setSelectedPriorities(selectedPriorities.filter(p => p !== pri.value));
                        } else {
                          setSelectedPriorities([...selectedPriorities, pri.value]);
                        }
                      }}
                    />
                    {pri.label}
                  </label>
                ))}
              </div>
            )}
          </div>
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

      {(() => {
        let filteredNotifications = displayedNotifications;
        if (filter === 'unread') {
          filteredNotifications = displayedNotifications.filter(n => !readStatus[n.id]);
        }
        if (selectedPriorities.length > 0) {
          filteredNotifications = filteredNotifications.filter(n => selectedPriorities.includes(n.priority));
        }
        if (selectedCategories.length > 0) {
          filteredNotifications = filteredNotifications.filter(n => selectedCategories.includes(n.category));
        }
        return filteredNotifications.length === 0 ? (
          <p className="empty-message">
            Ühtegi teadet ei ole.
          </p>
        ) : (
          <ul>
            {filteredNotifications.map((notification) => (
              <li key={notification.id} className={`notification-item${readStatus[notification.id] ? ' read' : ' unread'}`} data-priority={notification.priority}>
                <div className="notification-content">
                  <Link to={`/notifications/${notification.id}`} className="notification-link" onClick={(e) => { if (userRole === 'student') { markAsRead(notification.id); } }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <h3 style={{ margin: 0 }}>{notification.title}</h3>
                      <span className="category-label">{notification.category}</span>
                    </div>
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
        );
      })()}

      <ConfirmationModal
        open={modalOpen}
        message={modalMessage}
        onConfirm={() => { if (modalAction) modalAction(); }}
        onCancel={() => setModalOpen(false)}
      />
    </div>
  );
};

export default NotificationList;
