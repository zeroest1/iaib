import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegisterMutation, useLoginMutation, useGetMeQuery, useGetGroupsQuery } from '../../services/api';
import './styles/Register.css';

const Register = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    role: 'tudeng'
  });
  const [selectedGroups, setSelectedGroups] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const [register, { isLoading: isRegisterLoading }] = useRegisterMutation();
  const [login] = useLoginMutation();
  const { refetch } = useGetMeQuery();
  const { data: groups = [], isLoading: groupsLoading } = useGetGroupsQuery();

  // Filter out role-specific groups (is_role_group = true)
  const regularGroups = groups.filter(group => !group.is_role_group);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleGroupChange = (e) => {
    const groupId = parseInt(e.target.value);
    setSelectedGroups(prevGroups => {
      if (e.target.checked) {
        return [...prevGroups, groupId];
      } else {
        return prevGroups.filter(id => id !== groupId);
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      // Include selected groups in registration data
      await register({
        ...form,
        groups: selectedGroups.length > 0 ? selectedGroups : []
      }).unwrap();
      
      // After registration, login automatically
      await login({ email: form.email, password: form.password }).unwrap();
      await refetch(); // Refresh user data after login
      navigate('/');
    } catch (err) {
      setError(err.data?.error || 'Registration failed');
    }
  };

  return (
    <div className="register-form">
      <h2>Registreeru</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Nimi</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Parool</label>
          <input
            id="password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="role">Roll</label>
          <select
            id="role"
            name="role"
            value={form.role}
            onChange={handleChange}
          >
            <option value="tudeng">Õpilane</option>
            <option value="programmijuht">Programmijuht</option>
          </select>
        </div>

        {/* Group selection */}
        <div className="form-group">
          <label>Grupid</label>
          <div className="groups-container">
            {groupsLoading ? (
              <p>Laen gruppe...</p>
            ) : regularGroups.length > 0 ? (
              regularGroups.map(group => (
                <div key={group.id} className="group-checkbox">
                  <input
                    type="checkbox"
                    id={`group-${group.id}`}
                    value={group.id}
                    checked={selectedGroups.includes(group.id)}
                    onChange={handleGroupChange}
                  />
                  <label htmlFor={`group-${group.id}`}>
                    {group.name}
                    {group.description && <span className="group-description"> - {group.description}</span>}
                  </label>
                </div>
              ))
            ) : (
              <p>Gruppe ei leitud</p>
            )}
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="submit-button" disabled={isRegisterLoading}>
          {isRegisterLoading ? 'Registreerimine...' : 'Registreeru'}
        </button>
      </form>
    </div>
  );
};

export default Register; 