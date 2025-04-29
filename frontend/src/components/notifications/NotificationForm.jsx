// src/components/NotificationForm.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './styles/NotificationForm.css';
import { useAddNotificationMutation } from '../../services/api';
import NotificationFormFields from './NotificationFormFields';

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
        <NotificationFormFields
          formData={formData}
          handleChange={handleChange}
          error={error}
          isSubmitting={isLoading}
          submitButtonText="Lisa teade"
          loadingText="Lisan teadet..."
        />
      </form>
    </div>
  );
};

export default NotificationForm;
