// src/components/NotificationDetail.jsx
import React from 'react';
import { useParams, useNavigate, Link, useLocation } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './styles/NotificationDetail.css';
import { useGetNotificationQuery } from '../../services/api';

const NotificationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useSelector(state => state.auth);
  
  const { data: notification, isLoading, error } = useGetNotificationQuery(id);

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

  if (error) {
    return <p className="error-message">See teade on kustutatud või ei ole olemas.</p>;
  }

  if (isLoading) {
    return <p className="loading-message">Laen...</p>;
  }

  // Check if the current user is program manager and created this notification
  const canEdit = user?.role === 'programmijuht' && user.id === notification.created_by;

  return (
    <div className="notification-detail">
      <h2>{notification.title}</h2>
      <div className="notification-content">
        <p>{notification.content}</p>
        <div className="notification-meta">
          <p>Kategooria: {notification.category}</p>
          <p>Prioriteet: {getPriorityText(notification.priority)}</p>
          <p><i>Loodud: {new Date(notification.created_at).toLocaleString()}</i></p>
        </div>
      </div>
      <div className="button-group">
        <button onClick={handleBack} className="action-button">Tagasi</button>
        {canEdit && (
          <Link to={`/notifications/${id}/edit`} className="action-button">
            Muuda teadet
          </Link>
        )}
      </div>
    </div>
  );
};

export default NotificationDetail;
