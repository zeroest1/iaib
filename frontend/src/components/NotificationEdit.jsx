// src/components/NotificationEdit.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import './NotificationForm.css';

const NotificationEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [notification, setNotification] = useState({
    title: '',
    content: '',
    category: '',
    priority: 'tavaline'
  });
  const [error, setError] = useState('');

  useEffect(() => {
    fetchNotification();
  }, []);

  const fetchNotification = async () => {
    try {
      const res = await axios.get(`http://localhost:5000/api/notifications/${id}`);
      setNotification({
        title: res.data.title,
        content: res.data.content,
        category: res.data.category,
        priority: res.data.priority
      });
    } catch (err) {
      console.error('Viga teate laadimisel:', err);
      setError('Viga teate laadimisel');
    }
  };

  const handleChange = (e) => {
    setNotification({ ...notification, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5000/api/notifications/${id}`, notification);
      navigate('/');
    } catch (err) {
      console.error('Viga teate muutmisel:', err);
      setError('Viga teate muutmisel');
    }
  };

  return (
    <div className="notification-form">
      <h2>Muuda teadet</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Pealkiri</label>
          <input
            type="text"
            name="title"
            value={notification.title}
            onChange={handleChange}
            className="form-input"
            placeholder="Pealkiri"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">Sisu</label>
          <textarea
            name="content"
            value={notification.content}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Sisu"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="category">Kategooria</label>
          <select
            name="category"
            value={notification.category}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="">Vali kategooria</option>
            <option value="üldine">Üldine</option>
            <option value="tähtis">Tähtis</option>
          </select>
        </div>
        <div className="form-group">
          <label htmlFor="priority">Prioriteet</label>
          <select
            name="priority"
            value={notification.priority}
            onChange={handleChange}
            className="form-select"
            required
          >
            <option value="kiire">Kiire</option>
            <option value="kõrge">Kõrge</option>
            <option value="tavaline">Tavaline</option>
            <option value="madal">Madal</option>
          </select>
        </div>
        {error && <p className="error-message">{error}</p>}
        <button type="submit" className="submit-button">Salvesta muudatused</button>
      </form>
    </div>
  );
};

export default NotificationEdit;
