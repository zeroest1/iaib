// src/components/NotificationEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './styles/NotificationForm.css';
import { useGetNotificationQuery, useUpdateNotificationMutation } from '../../services/api';
import NotificationFormFields from './NotificationFormFields';

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
        <NotificationFormFields
          formData={notification}
          handleChange={handleChange}
          error={error}
          isSubmitting={isUpdating}
          submitButtonText="Salvesta muudatused"
          loadingText="Salvestamine..."
        />
      </form>
    </div>
  );
};

export default NotificationEdit;
