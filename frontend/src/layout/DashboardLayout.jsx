import React, { useState, useCallback, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './styles/DashboardLayout.css';
import axios from 'axios';
import NotificationList from '../components/notifications/NotificationList';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../config/api';

const POLLING_INTERVAL = 5000; // Poll every 5 seconds

// Custom hook for polling data
const usePolling = (fetchFunction) => {
  useEffect(() => {
    fetchFunction();
    const interval = setInterval(() => {
      fetchFunction();
    }, POLLING_INTERVAL);
    return () => clearInterval(interval);
  }, [fetchFunction]);
};

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

const DashboardLayout = ({ children }) => {
  const [favorites, setFavorites] = useState([]);
  const [unread, setUnread] = useState([]);
  const [allNotifications, setAllNotifications] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);

  const fetchFavorites = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/favorites`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(res.data);
    } catch (err) {
      setFavorites([]);
    }
  }, []);

  const fetchUnread = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/notifications/unread`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnread(res.data);
    } catch (err) {
      setUnread([]);
    }
  }, []);

  const fetchAllNotifications = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/notifications`);
      setAllNotifications(res.data);
    } catch (err) {
      setAllNotifications([]);
    }
  }, []);

  // Use the custom hook for polling
  usePolling(fetchAllNotifications);
  usePolling(fetchUnread);
  usePolling(fetchFavorites);

  const refreshAllNotifications = () => {
    fetchAllNotifications();
  };

  const handleLogout = () => {
    setLogoutModalOpen(true);
  };

  const confirmLogout = () => {
    logout();
    navigate('/login');
    setLogoutModalOpen(false);
  };

  const cancelLogout = () => {
    setLogoutModalOpen(false);
  };

  const handleSidebarClick = (filter) => {
    setActiveFilter(filter);
    if (filter === 'favorites') navigate('/favorites');
    else navigate('/');
  };

  const refreshFavorites = () => {
    fetchFavorites();
  };

  const refreshUnread = () => {
    fetchUnread();
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-title">Teavitussüsteem</div>
        <nav>
          <ul>
            {user && user.role === 'student' && (
              <>
                <li>
                  <button
                    className={activeFilter === 'all' ? 'sidebar-active' : ''}
                    onClick={() => handleSidebarClick('all')}
                  >
                    Kõik teated ({allNotifications.length})
                  </button>
                </li>
                <li><button className={activeFilter === 'unread' ? 'sidebar-active' : ''} onClick={() => handleSidebarClick('unread')}>Lugemata ({unread.length})</button></li>
                <li><button className={activeFilter === 'favorites' ? 'sidebar-active' : ''} onClick={() => handleSidebarClick('favorites')}>Lemmikud ({favorites.length})</button></li>
              </>
            )}
            {user && user.role === 'programmijuht' && (
              <>
                <li><Link to="/">Teated</Link></li>
                <li><Link to="/add">Lisa teade</Link></li>
              </>
            )}
            <li><button onClick={handleLogout} className="sidebar-logout">Logi välja</button></li>
          </ul>
        </nav>
      </aside>
      <div className="main-content">
        <header className="dashboard-header">
          {user && (
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">({user.role})</span>
            </div>
          )}
        </header>
        <div className="dashboard-children">
          {user && user.role === 'student' ? (
            location.pathname === '/' ? (
              <NotificationList filter={activeFilter} onFavoritesChange={refreshFavorites} onUnreadChange={refreshUnread} />
            ) : location.pathname === '/favorites' ? (
              <NotificationList showFavoritesOnly={true} onFavoritesChange={refreshFavorites} onUnreadChange={refreshUnread} />
            ) : (
              children
            )
          ) : children}
        </div>
      </div>
      <ConfirmationModal
        open={logoutModalOpen}
        message="Oled kindel, et soovid välja logida?"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </div>
  );
};

export default DashboardLayout; 