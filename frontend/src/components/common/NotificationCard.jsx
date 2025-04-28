import React from 'react';
import { Link } from 'react-router-dom';
import './styles/NotificationCard.css';

const NotificationCard = ({ 
  notification, 
  isFavorite = false, 
  onToggleFavorite, 
  onDelete,
  showActions = true,
  userRole,
  userId
}) => {
  const { id, title, content, priority, created_by, created_at } = notification;

  const handleToggleFavorite = (e) => {
    e.preventDefault();
    onToggleFavorite(id);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    onDelete(id);
  };

  return (
    <div className={`notification-card ${priority}`}>
      <Link to={`/notifications/${id}`} className="notification-link">
        <h3>{title}</h3>
        <p className="excerpt">{content.slice(0, 100)}{content.length > 100 ? '...' : ''}</p>
        <div className="notification-meta">
          <span className="priority">{priority}</span>
          <span className="date">{new Date(created_at).toLocaleDateString()}</span>
        </div>
      </Link>
      
      {showActions && (
        <div className="notification-actions">
          {userRole === 'student' && (
            <button 
              className={`favorite-button ${isFavorite ? 'active' : ''}`}
              onClick={handleToggleFavorite}
            >
              {isFavorite ? '★' : '☆'}
            </button>
          )}
          {userRole === 'programmijuht' && userId === created_by && (
            <button 
              className="delete-button"
              onClick={handleDelete}
            >
              Kustuta
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationCard; 