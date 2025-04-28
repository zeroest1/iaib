import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../config/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch user info if token exists
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }
    axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => {
        setUser(res.data);
        setLoading(false);
      })
      .catch(() => {
        setUser(null);
        setLoading(false);
      });
  }, []);

  // Login function
  const login = useCallback(async (email, password) => {
    const res = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
    localStorage.setItem('token', res.data.token);
    // Fetch user info after login
    const userRes = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${res.data.token}` }
    });
    setUser(userRes.data);
  }, []);

  // Logout function
  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  // Register function
  const register = useCallback(async (form) => {
    await axios.post(`${API_BASE_URL}/auth/register`, form);
    // Automatically log in after registration
    const loginRes = await axios.post(`${API_BASE_URL}/auth/login`, { email: form.email, password: form.password });
    localStorage.setItem('token', loginRes.data.token);
    const userRes = await axios.get(`${API_BASE_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${loginRes.data.token}` }
    });
    setUser(userRes.data);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 