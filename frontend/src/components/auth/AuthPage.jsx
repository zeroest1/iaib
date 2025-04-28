import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';
import './styles/AuthPage.css';

const AuthPage = () => {
  const [tab, setTab] = useState('login');

  return (
    <div className="auth-container">
      <div className="tab-buttons">
        <button
          onClick={() => setTab('login')}
          className={`tab-button ${tab === 'login' ? 'active' : ''}`}
        >
          Logi sisse
        </button>
        <button
          onClick={() => setTab('register')}
          className={`tab-button ${tab === 'register' ? 'active' : ''}`}
        >
          Registreeru
        </button>
      </div>
      {tab === 'login' ? <Login /> : <Register />}
    </div>
  );
};

export default AuthPage; 