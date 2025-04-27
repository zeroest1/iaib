// src/components/NotificationList.jsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import './NotificationList.css';

const NotificationList = () => {
  const [notifications, setNotifications] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/notifications');
      setNotifications(res.data);
    } catch (err) {
      console.error('Viga teadete laadimisel:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/notifications/${id}`);
      setNotifications(notifications.filter((n) => n.id !== id));
    } catch (err) {
      console.error('Viga kustutamisel:', err);
    }
  };
  

  return (
    <div className="notification-list">
      <div className="header-section">
        <h2>Teated</h2>
        <button 
          onClick={() => navigate('/add')} 
          className="add-button"
        >
          Lisa uus teade
        </button>
      </div>
      {notifications.length === 0 ? (
        <p className="empty-message">Ühtegi teadet ei ole.</p>
      ) : (
        <ul>
          {notifications.map((notification) => (
            <li key={notification.id} className="notification-item" data-priority={notification.priority}>
              <Link to={`/notifications/${notification.id}`} className="notification-link">
                {notification.title}
              </Link>
              <button 
                onClick={() => handleDelete(notification.id)} 
                className="delete-button"
              >
                Kustuta
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationList;
