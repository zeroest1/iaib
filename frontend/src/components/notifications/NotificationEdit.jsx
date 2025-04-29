// src/components/NotificationEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './styles/NotificationForm.css';
import { useGetNotificationQuery, useUpdateNotificationMutation } from '../../services/api';

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
  const { user } = useSelector(state => state.auth);
  
  const { data, isLoading: isFetching } = useGetNotificationQuery(id);
  const [updateNotification, { isLoading: isUpdating }] = useUpdateNotificationMutation();

  // Set initial form data once notification is fetched
  useEffect(() => {
    if (data) {
      setNotification({
        title: data.title,
        content: data.content,
        category: data.category,
        priority: data.priority
      });
    }
  }, [data]);

  // Check user role and redirect if not authorized
  useEffect(() => {
    if (user && user.role !== 'programmijuht') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setNotification({ ...notification, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateNotification({
        id,
        ...notification
      }).unwrap();
      navigate('/');
    } catch (err) {
      console.error('Viga teate muutmisel:', err);
      setError('Viga teate muutmisel');
    }
  };

  if (isFetching) {
    return <div>Laen...</div>;
  }

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
            <option value="õppetöö">Õppetöö</option>
            <option value="hindamine">Hindamine</option>
            <option value="praktika">Praktika</option>
            <option value="stipendium">Stipendium</option>
            <option value="sündmused">Sündmused</option>
            <option value="erakorralised">Erakorralised</option>
            <option value="muu">Muu</option>
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
        <button type="submit" className="submit-button" disabled={isUpdating}>
          {isUpdating ? 'Salvestamine...' : 'Salvesta muudatused'}
        </button>
      </form>
    </div>
  );
};

export default NotificationEdit;
