// src/components/NotificationDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import './NotificationDetail.css';

const NotificationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    fetchNotification();
  }, []);

  const fetchNotification = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/notifications/${id}`);
      setNotification(res.data);
    } catch (err) {
      console.error('Viga teate laadimisel:', err);
    }
  };

  const handleBack = () => {
    navigate('/');
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

  if (!notification) {
    return <p className="loading-message">Laen...</p>;
  }

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
        <Link to={`/notifications/${id}/edit`} className="action-button">
          Muuda teadet
        </Link>
      </div>
    </div>
  );
};

export default NotificationDetail;
