import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MdDelete, MdEdit } from 'react-icons/md';

const NotificationItem = ({
  notification,
  userRole,
  userId,
  readStatus,
  onMarkAsRead,
  onToggleFavorite,
  onDelete,
  isFavorite
}) => {
  const isRead = readStatus && readStatus[notification.id] === true;
  const location = useLocation();
  
  return (
    <li className={`notification-item${isRead ? ' read' : ' unread'}`} data-priority={notification.priority}>
      <div className="notification-content">
        <Link 
          to={`/notifications/${notification.id}`} 
          state={{ from: location.pathname + location.search }}
          className="notification-link" 
          onClick={() => onMarkAsRead(notification.id)}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <h3 style={{ margin: 0 }}>{notification.title}</h3>
            <span className="category-label">{notification.category}</span>
          </div>
          <p className="excerpt">{notification.content.slice(0, 100)}{notification.content.length > 100 ? '...' : ''}</p>
          {notification.excerpt && <p className="excerpt">{notification.excerpt}</p>}
          <p className="creator">Autor: {notification.creator_name}</p>
        </Link>
        <div className="notification-actions">
          <button
            className={`favorite-button ${isFavorite ? 'active' : ''}`}
            onClick={() => onToggleFavorite(notification.id)}
            title={isFavorite ? 'Eemalda lemmikutest' : 'Lisa lemmikutesse'}
          >
            {isFavorite ? '★' : '☆'}
          </button>
          {onDelete && (
            <div className="admin-actions">
              <Link 
                to={`/notifications/${notification.id}/edit`}
                className="edit-button"
                title="Muuda teadet"
              >
                <MdEdit />
                <span>Muuda</span>
              </Link>
              <button
                onClick={() => onDelete(notification.id)}
                className="delete-button"
                title="Kustuta teade"
              >
                <MdDelete />
                <span>Kustuta</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </li>
  );
};

export default NotificationItem; 