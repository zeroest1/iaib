import React from 'react';
import { Link } from 'react-router-dom';

const NotificationItem = ({
  notification,
  userRole,
  userId,
  readStatus,
  onMarkAsRead,
  onToggleFavorite,
  onDelete,
  isFavorite
}) => (
  <li className={`notification-item${readStatus[notification.id] ? ' read' : ' unread'}`} data-priority={notification.priority}>
    <div className="notification-content">
      <Link to={`/notifications/${notification.id}`} className="notification-link" onClick={() => userRole === 'student' && onMarkAsRead(notification.id)}>
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
          className={`favorite-button ${isFavorite ? 'active' : ''}`}
          onClick={() => onToggleFavorite(notification.id)}
        >
          {isFavorite ? '★' : '☆'}
        </button>
      )}
      {userRole === 'programmijuht' && notification.created_by === userId && (
        <button
          onClick={() => onDelete(notification.id)}
          className="delete-button"
        >
          Kustuta
        </button>
      )}
    </div>
  </li>
);

export default NotificationItem; 