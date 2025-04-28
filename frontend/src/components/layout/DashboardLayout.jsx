import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './DashboardLayout.css';
import axios from 'axios';
import NotificationList from '../notifications/NotificationList';

const DashboardLayout = ({ children }) => {
  const [user, setUser] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [unread, setUnread] = useState([]);
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:5000/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(res.data);
        if (res.data.role === 'student') {
          fetchFavorites(token);
          fetchUnread(token);
        }
      } catch (err) {
        setUser(null);
      }
    };
    fetchUser();
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    if (user && user.role === 'student') {
      const token = localStorage.getItem('token');
      fetchFavorites(token);
      fetchUnread(token);
    }
    // eslint-disable-next-line
  }, [location.pathname]);

  const fetchFavorites = useCallback(async (token) => {
    try {
      const res = await axios.get('http://localhost:5000/api/favorites', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setFavorites(res.data);
    } catch (err) {
      setFavorites([]);
    }
  }, []);

  const fetchUnread = useCallback(async (token) => {
    try {
      const res = await axios.get('http://localhost:5000/api/notifications/unread', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUnread(res.data);
    } catch (err) {
      setUnread([]);
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const handleSidebarClick = (filter) => {
    setActiveFilter(filter);
    if (filter === 'favorites') navigate('/favorites');
    else navigate('/');
  };

  const refreshFavorites = () => {
    const token = localStorage.getItem('token');
    fetchFavorites(token);
  };

  const refreshUnread = () => {
    const token = localStorage.getItem('token');
    fetchUnread(token);
  };

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-title">Teavitussüsteem</div>
        <nav>
          <ul>
            {user && user.role === 'student' && (
              <>
                <li><button className={activeFilter === 'all' ? 'sidebar-active' : ''} onClick={() => handleSidebarClick('all')}>Kõik teated</button></li>
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
    </div>
  );
};

export default DashboardLayout; 