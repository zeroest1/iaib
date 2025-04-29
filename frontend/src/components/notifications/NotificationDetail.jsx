// src/components/NotificationDetail.jsx
import React from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { MdArrowBack, MdEdit } from 'react-icons/md';
import './styles/NotificationDetail.css';
import { useGetNotificationQuery, useGetNotificationGroupsQuery } from '../../services/api';

const NotificationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(state => state.auth);
  
  const { data: notification, isLoading, error } = useGetNotificationQuery(id);
  const { data: notificationGroups = [] } = useGetNotificationGroupsQuery(id);

  const handleBack = () => {
    // Check if we have a stored previous location
    const previousPath = location.state?.from || '/';
    navigate(previousPath);
  };

  const getPriorityText = (priority) => {
    switch (priority) {
      case 'kiire':
        return 'Kiire';
      case 'kõrge':
        return 'Kõrge';
      case 'tavaline':
        return 'Tavaline';
      case 'madal':
        return 'Madal';
      default:
        return 'Tundmatu';
    }
  };

  const formatGroupInfo = () => {
    if (!notificationGroups || notificationGroups.length === 0) {
      return 'Kõik grupid (avalik)';
    }
    
    const roleGroups = notificationGroups.filter(g => g.is_role_group);
    const regularGroups = notificationGroups.filter(g => !g.is_role_group);
    
    let result = [];
    if (roleGroups.length > 0) {
      result.push(`Rollipõhised: ${roleGroups.map(g => g.name).join(', ')}`);
    }
    if (regularGroups.length > 0) {
      result.push(`Grupid: ${regularGroups.map(g => g.name).join(', ')}`);
    }
    
    return result.join(' | ');
  };

  if (error) {
    return <p className="error-message">See teade on kustutatud või ei ole olemas.</p>;
  }

  if (isLoading) {
    return <p className="loading-message">Laen...</p>;
  }

  // Check if the current user is programmijuht and created this notification
  const canEdit = user?.role === 'programmijuht' && user.id === notification.created_by;

  return (
    <div className="notification-detail">
      <h2>{notification.title}</h2>
      <div className="notification-content">
        <p>{notification.content}</p>
        <div className="notification-meta">
          <p>Kategooria: {notification.category}</p>
          <p>Prioriteet: {getPriorityText(notification.priority)}</p>
          {user?.role === 'programmijuht' && (
            <p>Sihtgrupid: {formatGroupInfo()}</p>
          )}
          <p><i>Loodud: {new Date(notification.created_at).toLocaleString()}</i></p>
        </div>
      </div>
      <div className="button-group">
        <Link to={location.state?.from || '/'} className="action-button back-button">
          <MdArrowBack />
          <span style={{ marginLeft: '6px' }}>Tagasi</span>
        </Link>
        {canEdit && (
          <Link to={`/notifications/${id}/edit`} className="action-button">
            <MdEdit />
            <span style={{ marginLeft: '6px' }}>Muuda teadet</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default NotificationDetail;
