// src/components/NotificationEdit.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import './styles/NotificationForm.css';
import { 
  useGetNotificationQuery, 
  useUpdateNotificationMutation, 
  useGetGroupsQuery,
  useGetNotificationGroupsQuery
} from '../../services/api';
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
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [error, setError] = useState('');
  const { user } = useSelector(state => state.auth);
  
  const { data, isLoading: isFetching } = useGetNotificationQuery(id);
  const { data: groups = [], isLoading: groupsLoading } = useGetGroupsQuery();
  const { data: notificationGroups = [], isLoading: notificationGroupsLoading } = useGetNotificationGroupsQuery(id);
  const [updateNotification, { isLoading: isUpdating }] = useUpdateNotificationMutation();

  // Debug: log groups when they change
  useEffect(() => {
    console.log('Available groups:', groups);
  }, [groups]);

  // Debug: log notification groups when they change
  useEffect(() => {
    console.log('Notification groups:', notificationGroups);
  }, [notificationGroups]);

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

  // Set selected groups once notification groups are fetched
  useEffect(() => {
    if (notificationGroups && notificationGroups.length > 0) {
      const groupIds = notificationGroups.map(group => group.id);
      console.log('Setting selected groups from notification:', groupIds);
      setSelectedGroups(groupIds);
    }
  }, [notificationGroups]);

  // Check user role and redirect if not authorized
  useEffect(() => {
    if (user && user.role !== 'programmijuht') {
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e) => {
    setNotification({ ...notification, [e.target.name]: e.target.value });
  };

  const handleGroupChange = (newSelectedGroups) => {
    console.log('Selected groups changed to:', newSelectedGroups);
    setSelectedGroups(newSelectedGroups);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      console.log('Updating notification with groups:', selectedGroups);
      await updateNotification({
        id,
        ...notification,
        targetGroups: selectedGroups
      }).unwrap();
      navigate('/');
    } catch (err) {
      console.error('Viga teate muutmisel:', err);
      setError('Viga teate muutmisel');
    }
  };

  if (isFetching || groupsLoading || notificationGroupsLoading) {
    return <div>Laen...</div>;
  }

  return (
    <div className="notification-form">
      <h2>Muuda teadet</h2>
      {groups.length === 0 && !groupsLoading && (
        <div className="warning-message">Hoiatus: Grupid ei ole laaditud. Võimalik API viga.</div>
      )}
      <form onSubmit={handleSubmit}>
        <NotificationFormFields
          formData={notification}
          handleChange={handleChange}
          error={error}
          isSubmitting={isUpdating}
          submitButtonText="Salvesta muudatused"
          loadingText="Salvestamine..."
          availableGroups={groups}
          selectedGroups={selectedGroups}
          handleGroupChange={handleGroupChange}
        />
      </form>
    </div>
  );
};

export default NotificationEdit;
