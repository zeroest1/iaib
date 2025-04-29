// src/components/NotificationForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './styles/NotificationForm.css';
import { useAddNotificationMutation, useGetGroupsQuery } from '../../services/api';
import NotificationFormFields from './NotificationFormFields';

const NotificationForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    priority: 'tavaline'
  });
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const { user } = useSelector(state => state.auth);
  
  const { data: groups = [], isLoading: groupsLoading } = useGetGroupsQuery();
  const [addNotification, { isLoading }] = useAddNotificationMutation();

  // Debug: log groups when they change
  useEffect(() => {
    console.log('Available groups:', groups);
  }, [groups]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleGroupChange = (newSelectedGroups) => {
    console.log('Selected groups changed to:', newSelectedGroups);
    setSelectedGroups(newSelectedGroups);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Submitting notification with groups:', selectedGroups);
      await addNotification({
        title: formData.title,
        content: formData.content,
        category: formData.category,
        priority: formData.priority,
        createdBy: user.id,
        targetGroups: selectedGroups.length > 0 ? selectedGroups : null
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
      {groups.length === 0 && !groupsLoading && (
        <div className="warning-message">Hoiatus: Grupid ei ole laaditud. Võimalik API viga.</div>
      )}
      <form onSubmit={handleSubmit}>
        <NotificationFormFields
          formData={formData}
          handleChange={handleChange}
          error={error}
          isSubmitting={isLoading || groupsLoading}
          submitButtonText="Lisa teade"
          loadingText="Lisan teadet..."
          availableGroups={groups}
          selectedGroups={selectedGroups}
          handleGroupChange={handleGroupChange}
        />
      </form>
    </div>
  );
};

export default NotificationForm;
