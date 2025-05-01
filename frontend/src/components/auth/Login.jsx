import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation, useGetMeQuery } from '../../services/api';
import './styles/Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  
  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const { refetch } = useGetMeQuery();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await login({ email, password }).unwrap();
      await refetch(); // Refresh user data after login
      navigate('/');
    } catch (err) {
      setError(err.data?.error || 'Login failed');
    }
  };

  return (
    <div className="login-form">
      <h2>Logi sisse</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Parool</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" className="submit-button" disabled={isLoginLoading}>
          {isLoginLoading ? 'Sisselogimine...' : 'Logi sisse'}
        </button>
      </form>
    </div>
  );
};

export default Login; 