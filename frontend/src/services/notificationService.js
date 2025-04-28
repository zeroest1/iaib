import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

const getAuthHeader = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export const notificationService = {
  // Fetch all notifications
  getAll: async () => {
    const response = await axios.get(`${API_URL}/notifications`);
    return response.data;
  },

  // Fetch a single notification
  getById: async (id) => {
    const response = await axios.get(`${API_URL}/notifications/${id}`);
    return response.data;
  },

  // Create a new notification
  create: async (notificationData) => {
    const response = await axios.post(`${API_URL}/notifications`, notificationData, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Update a notification
  update: async (id, notificationData) => {
    const response = await axios.put(`${API_URL}/notifications/${id}`, notificationData, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Delete a notification
  delete: async (id) => {
    await axios.delete(`${API_URL}/notifications/${id}`, {
      headers: getAuthHeader()
    });
  },

  // Mark notification as read
  markAsRead: async (id) => {
    await axios.post(`${API_URL}/notifications/${id}/read`, {}, {
      headers: getAuthHeader()
    });
  },

  // Get favorites
  getFavorites: async () => {
    const response = await axios.get(`${API_URL}/favorites`, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Toggle favorite
  toggleFavorite: async (notificationId) => {
    const response = await axios.post(`${API_URL}/favorites`, { notificationId }, {
      headers: getAuthHeader()
    });
    return response.data;
  },

  // Remove favorite
  removeFavorite: async (notificationId) => {
    await axios.delete(`${API_URL}/favorites/${notificationId}`, {
      headers: getAuthHeader()
    });
  }
}; 