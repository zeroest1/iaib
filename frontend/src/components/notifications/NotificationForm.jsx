// src/components/NotificationForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './styles/NotificationForm.css';
import { useAddNotificationMutation } from '../../services/api';

const NotificationForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    priority: 'tavaline'
  });
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  const [addNotification, { isLoading }] = useAddNotificationMutation();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await addNotification({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        priority: formData.priority,
        createdBy: user.id
      }).unwrap();
      navigate('/');
    } catch (err) {
      setError('Viga teate lisamisel');
      console.error(err);
    }
  };

  return (
    <div className="notification-form">
      <h2>Lisa uus teade</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title">Pealkiri</label>
          <input
            type="text"
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="form-input"
            placeholder="Sisesta pealkiri"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="content">Sisu</label>
          <textarea
            id="content"
            name="content"
            value={formData.content}
            onChange={handleChange}
            className="form-textarea"
            placeholder="Sisesta teate sisu"
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="category">Kategooria</label>
          <select
            id="category"
            name="category"
            value={formData.category}
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
            id="priority"
            name="priority"
            value={formData.priority}
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
        <button type="submit" className="submit-button" disabled={isLoading}>
          {isLoading ? 'Lisan teadet...' : 'Lisa teade'}
        </button>
      </form>
    </div>
  );
};

export default NotificationForm;
