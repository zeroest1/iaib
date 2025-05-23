import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { logout } from '../features/authSlice';
import { useGetNotificationsQuery, useGetReadStatusQuery, useGetUserGroupsQuery } from '../services/api';
import ConfirmationModal from '../components/common/ConfirmationModal';
import './styles/DashboardLayout.css';
import { 
  MdOutlinePostAdd, 
  MdNotifications, 
  MdMarkEmailUnread, 
  MdFavorite, 
  MdPersonalVideo, 
  MdLogout,
  MdOutlineDescription,
  MdMenu,
  MdClose
} from 'react-icons/md';
import TalTechLogo from '../assets/taltech-logo.svg';

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
  const [modalOpen, setModalOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Toggle sidebar for mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar when clicking outside or changing routes
  const closeSidebar = useCallback(() => {
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  }, [sidebarOpen]);

  // Close sidebar on route change
  useEffect(() => {
    closeSidebar();
  }, [location, closeSidebar]);

  // RTK Query hooks - request all notifications by setting a high limit
  const { data = {}, isLoading: notificationsLoading } = useGetNotificationsQuery({ 
    my: false,
    limit: 100 // Request more items to get a more accurate count
  });
  
  // Memoize the notifications and totalCount to avoid dependency issues
  const { memoizedNotifications, memoizedTotalCount } = React.useMemo(() => ({
    memoizedNotifications: data.notifications || [],
    memoizedTotalCount: data.pagination?.total || 0
  }), [data.notifications, data.pagination?.total]);
  
  const { 
    data: readStatusData = [], 
    isSuccess: readStatusSuccess 
  } = useGetReadStatusQuery();
  const { data: userGroups = [], isLoading: userGroupsLoading } = useGetUserGroupsQuery();

  // Format user group information
  const formatUserGroupInfo = () => {
    if (!userGroups || userGroups.length === 0) {
      return 'Puuduvad';
    }
    const roleGroups = userGroups.filter(g => g.is_role_group);
    const regularGroups = userGroups.filter(g => !g.is_role_group);
    
    let result = [];
    if (roleGroups.length > 0) {
      result.push(`Roll: ${roleGroups.map(g => g.name).join(', ')}`);
    }
    if (regularGroups.length > 0) {
      result.push(`Grupid: ${regularGroups.map(g => g.name).join(', ')}`);
    }
    return result.join(' | ');
  };

  // Update active filter when location changes
  useEffect(() => {
    if (location.pathname === '/favorites') setActiveFilter('favorites');
    else if (location.pathname === '/my-notifications') setActiveFilter('my');
    else if (location.pathname === '/add-notification') setActiveFilter('add');
    else if (location.pathname === '/templates') setActiveFilter('templates');
    else if (location.search.includes('filter=unread')) setActiveFilter('unread');
    else if (location.pathname === '/') setActiveFilter('all');
  }, [location]);

  // Calculate read status
  const readStatus = React.useMemo(() => {
    const status = {};
    
    // Mark all notifications as unread by default
    if (memoizedNotifications && memoizedNotifications.length > 0) {
      memoizedNotifications.forEach(notification => {
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
  }, [memoizedNotifications, readStatusData, readStatusSuccess]);

  // Calculate unread count
  const unreadCount = React.useMemo(() => {
    if (notificationsLoading) return 0;
    
    // For new users with no readStatusData, all notifications are unread
    if (memoizedTotalCount > 0 && (!readStatusData || readStatusData.length === 0)) {
      return memoizedTotalCount; // If no read status data, all notifications are unread
    }
    
    // If we have the total from pagination metadata but don't have all notifications loaded
    if (memoizedTotalCount > memoizedNotifications.length && readStatusData && readStatusData.length > 0) {
      // Calculate the number of notifications that have a read status
      const readNotifications = readStatusData.filter(item => item.read).length;
      // Unread count is total notifications minus read notifications
      return memoizedTotalCount - readNotifications;
    }
    
    // Regular calculation using loaded notifications
    return memoizedNotifications.filter(notification => 
      readStatus[notification.id] === undefined || readStatus[notification.id] === false
    ).length;
  }, [memoizedNotifications, readStatus, notificationsLoading, readStatusData, memoizedTotalCount]);

  const handleLogoutRequest = () => {
    setModalOpen(true);
  };

  const confirmLogout = () => {
    dispatch(logout());
    navigate('/login');
    setModalOpen(false);
  };
  
  const cancelLogout = () => {
    setModalOpen(false);
  };

  // Check if the user is trying to access a route they don't have permission for
  // Redirect to home if user tries to access programmijuht routes
  useEffect(() => {
    if (user && user.role !== 'programmijuht') {
      if (location.pathname.includes('/edit') || location.pathname === '/add-notification') {
        navigate('/');
      }
    }
  }, [location, user, navigate]);

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
      <header className="dashboard-header">
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <button 
            className="sidebar-toggle mobile-toggle"
            onClick={toggleSidebar}
            aria-label="Toggle navigation"
          >
            {sidebarOpen ? <MdClose /> : <MdMenu />}
          </button>
          <img src={TalTechLogo} alt="TalTech Logo" className="header-logo" />
        </div>
        {user && (
          <div className="user-info">
            <div className="user-details">
              <span className="user-name">{user.name}</span>
              <span className="user-role">{user.role === 'programmijuht' ? 'Programmijuht' : 'Tudeng'}</span>
            </div>
            <div className="user-groups">
              {userGroupsLoading ? 'Laen gruppe...' : formatUserGroupInfo()}
            </div>
          </div>
        )}
      </header>
      
      <div className="content-wrapper">
        {/* Overlay for mobile */}
        <div 
          className={`sidebar-overlay ${sidebarOpen ? 'sidebar-overlay-visible' : ''}`} 
          onClick={closeSidebar}
        ></div>
        
        <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
          <div className="sidebar-title">Teavitussüsteem</div>
          
          <nav className="sidebar-nav">
            <ul>
              {/* Common menu items for both roles */}
              <li>
                <Link
                  to="/"
                  className={activeFilter === 'all' ? 'sidebar-active' : ''}
                  onClick={() => setActiveFilter('all')}
                >
                  <MdNotifications />
                  Teated
                  {unreadCount > 0 && <span className="unread-badge">{unreadCount}</span>}
                </Link>
              </li>
              <li>
                <Link 
                  to="/?filter=unread"
                  className={activeFilter === 'unread' ? 'sidebar-active' : ''} 
                  onClick={() => setActiveFilter('unread')}
                >
                  <MdMarkEmailUnread />
                  Lugemata
                </Link>
              </li>
              <li>
                <Link 
                  to="/favorites"
                  className={activeFilter === 'favorites' ? 'sidebar-active' : ''} 
                  onClick={() => setActiveFilter('favorites')}
                >
                  <MdFavorite />
                  Lemmikud
                </Link>
              </li>

              {/* Programmijuht specific menu items */}
              {user?.role === 'programmijuht' && (
                <>
                  <li>
                    <Link 
                      to="/my-notifications" 
                      className={activeFilter === 'my' ? 'sidebar-active' : ''}
                      onClick={() => setActiveFilter('my')}
                    >
                      <MdPersonalVideo />
                      Minu teated
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/add-notification"
                      className={activeFilter === 'add' ? 'sidebar-active' : ''}
                      onClick={() => setActiveFilter('add')}
                    >
                      <MdOutlinePostAdd />
                      Lisa uus teade
                    </Link>
                  </li>
                  <li>
                    <Link 
                      to="/templates"
                      className={activeFilter === 'templates' ? 'sidebar-active' : ''}
                      onClick={() => setActiveFilter('templates')}
                    >
                      <MdOutlineDescription />
                      Mallid
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </nav>
          
          <div className="sidebar-footer">
            <button 
              onClick={handleLogoutRequest}
              className="sidebar-logout"
            >
              <MdLogout />
              Logi välja
            </button>
          </div>
        </aside>

        <div className="main-content">
          <div className="dashboard-children">
            {childrenWithProps}
          </div>
        </div>
      </div>

      <ConfirmationModal
        open={modalOpen}
        title="Logi välja"
        message="Oled kindel, et soovid välja logida?"
        confirmText="Logi välja"
        cancelText="Tühista"
        onConfirm={confirmLogout}
        onCancel={cancelLogout}
      />
    </div>
  );
};

export default DashboardLayout; 