import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/authSlice';
import { useGetNotificationsQuery, useGetReadStatusQuery } from '../services/api';
import './styles/DashboardLayout.css';

const DashboardLayout = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { user } = useSelector(state => state.auth);
  const [activeFilter, setActiveFilter] = useState(() => {
    // Set initial filter based on location path
    if (location.pathname === '/favorites') return 'favorites';
    if (location.pathname === '/my-notifications') return 'my';
    if (location.search.includes('filter=unread')) return 'unread';
    return 'all';
  });

  // RTK Query hooks
  const { data: notifications = [], isLoading: notificationsLoading } = useGetNotificationsQuery({ my: false });
  const { 
    data: readStatusData = [], 
    isLoading: readStatusLoading,
    isSuccess: readStatusSuccess 
  } = useGetReadStatusQuery();

  // Update active filter when location changes
  useEffect(() => {
    if (location.pathname === '/favorites') setActiveFilter('favorites');
    else if (location.pathname === '/my-notifications') setActiveFilter('my');
    else if (location.search.includes('filter=unread')) setActiveFilter('unread');
    else if (location.pathname === '/') setActiveFilter('all');
  }, [location]);

  // Calculate read status
  const readStatus = React.useMemo(() => {
    const status = {};
    
    // Mark all notifications as unread by default
    if (notifications && notifications.length > 0) {
      notifications.forEach(notification => {
        status[notification.id] = false;
      });
    }
    
    // Update with server data if available
    if (readStatusSuccess && readStatusData && readStatusData.length > 0) {
      readStatusData.forEach(item => {
        status[item.notification_id] = item.read;
      });
    }
    
    return status;
  }, [notifications, readStatusData, readStatusSuccess]);

  // Calculate unread count
  const unreadCount = React.useMemo(() => {
    if (notificationsLoading) return 0;
    
    // For new users with no readStatusData, all notifications are unread
    if (notifications.length > 0 && (!readStatusData || readStatusData.length === 0)) {
      return notifications.length;
    }
    
    // Count unread notifications
    return notifications.filter(notification => 
      readStatus[notification.id] === undefined || readStatus[notification.id] === false
    ).length;
  }, [notifications, readStatus, notificationsLoading, readStatusData]);

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  const handleSidebarClick = (filter) => {
    setActiveFilter(filter);
    if (filter === 'favorites') navigate('/favorites');
    else if (filter === 'unread') navigate('/?filter=unread');
    else if (filter === 'all') navigate('/');
  };

  // Redirect to home if user tries to access program manager routes
  useEffect(() => {
    if (user && user.role !== 'programmijuht') {
      if (location.pathname === '/my-notifications' || 
          location.pathname === '/add' || 
          location.pathname.includes('/edit')) {
        navigate('/');
      }
    }
  }, [location.pathname, user, navigate]);

  // Clone the children element and pass the activeFilter prop
  const childrenWithProps = React.Children.map(children, child => {
    // Check if valid element
    if (React.isValidElement(child)) {
      return React.cloneElement(child, { filter: activeFilter === 'unread' ? 'unread' : 'all' });
    }
    return child;
  });

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-title">Teavitussüsteem</div>
        <nav>
          <ul>
            {/* Common menu items for both roles */}
            <li>
              <button
                className={activeFilter === 'all' ? 'sidebar-active' : ''}
                onClick={() => handleSidebarClick('all')}
              >
                Teated {notificationsLoading ? '...' : `(${notifications.length})`}
              </button>
            </li>
            <li>
              <button 
                className={activeFilter === 'unread' ? 'sidebar-active' : ''} 
                onClick={() => handleSidebarClick('unread')}
              >
                Lugemata {notificationsLoading ? '...' : (
                  <>
                    ({unreadCount})
                    {unreadCount > 0 && <span className="unread-badge" title="Lugemata teateid">{unreadCount}</span>}
                  </>
                )}
              </button>
            </li>
            <li>
              <button 
                className={activeFilter === 'favorites' ? 'sidebar-active' : ''} 
                onClick={() => handleSidebarClick('favorites')}
              >
                Lemmikud
              </button>
            </li>

            {/* Program manager specific menu items */}
            {user?.role === 'programmijuht' && (
              <>
                <li>
                  <Link 
                    to="/my-notifications" 
                    className={activeFilter === 'my' ? 'sidebar-active' : ''}
                  >
                    Minu teated
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/add" 
                    className={location.pathname === '/add' ? 'sidebar-active' : ''}
                  >
                    Lisa teade
                  </Link>
                </li>
              </>
            )}

            <li>
              <button onClick={handleLogout} className="sidebar-logout">
                Logi välja
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      <div className="main-content">
        <header className="dashboard-header">
          {user && (
            <div className="user-info">
              <span className="user-name">{user.name}</span>
              <span className="user-role">({user.role === 'programmijuht' ? 'Programmijuht' : 'Õpilane'})</span>
            </div>
          )}
        </header>
        <div className="dashboard-children">
          {childrenWithProps}
        </div>
      </div>
    </div>
  );
};

export default DashboardLayout; 