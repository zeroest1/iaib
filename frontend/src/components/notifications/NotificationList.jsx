// src/components/NotificationList.jsx
import React, { useEffect, useState, useRef, useMemo } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './styles/NotificationList.css';
import { API_BASE_URL } from '../../config/api';
import NotificationItem from './NotificationItem';
import MultiSelectDropdown from './MultiSelectDropdown';

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
  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const priorityDropdownRef = useRef(null);

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

  // Fetch user role only once on mount
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    fetchUserRole();
    // eslint-disable-next-line
  }, [navigate]);

  // Fetch notifications/favorites/readStatus after userRole is set
  useEffect(() => {
    if (!userRole) return;
    fetchNotifications();
    if (userRole === 'student') {
      fetchFavorites();
    }
    fetchReadStatus();
    const interval = setInterval(() => {
      fetchNotifications();
      if (userRole === 'student') {
        fetchFavorites();
      }
    }, POLLING_INTERVAL);
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [userRole]);

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

  // Memoize filtered notifications
  const filteredNotifications = useMemo(() => {
    let result = showFavoritesOnly
      ? notifications.filter(n => favoritesList.some(f => f.notification_id === n.id))
      : notifications;
    if (filter === 'unread') {
      result = result.filter(n => !readStatus[n.id]);
    }
    if (selectedPriorities.length > 0) {
      result = result.filter(n => selectedPriorities.includes(n.priority));
    }
    if (selectedCategories.length > 0) {
      result = result.filter(n => selectedCategories.includes(n.category));
    }
    return result;
  }, [notifications, favoritesList, showFavoritesOnly, filter, readStatus, selectedPriorities, selectedCategories]);

  return (
    <div className="notification-list">
      <div className="header-section">
        <h2>Teated</h2>
        <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
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
        <p className="empty-message">
          Ühtegi teadet ei ole.
        </p>
      ) : (
        <ul>
          {filteredNotifications.map((notification) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              userRole={userRole}
              userId={userId}
              readStatus={readStatus}
              onMarkAsRead={markAsRead}
              onToggleFavorite={toggleFavorite}
              onDelete={handleDelete}
              isFavorite={favoritesList.some(f => f.notification_id === notification.id)}
            />
          ))}
        </ul>
      )}

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
