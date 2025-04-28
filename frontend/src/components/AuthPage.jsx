import React, { useState } from 'react';
import Login from './Login';
import Register from './Register';

const AuthPage = () => {
  const [tab, setTab] = useState('login');

  return (
    <div style={{ maxWidth: 500, margin: '2rem auto', padding: 24, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
        <button
          onClick={() => setTab('login')}
          style={{
            padding: '10px 24px',
            border: 'none',
            borderRadius: '4px 0 0 4px',
            background: tab === 'login' ? '#e4067e' : '#f5f5f5',
            color: tab === 'login' ? '#fff' : '#333',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
            transition: 'background 0.2s',
          }}
        >
          Logi sisse
        </button>
        <button
          onClick={() => setTab('register')}
          style={{
            padding: '10px 24px',
            border: 'none',
            borderRadius: '0 4px 4px 0',
            background: tab === 'register' ? '#e4067e' : '#f5f5f5',
            color: tab === 'register' ? '#fff' : '#333',
            fontWeight: 600,
            cursor: 'pointer',
            outline: 'none',
            transition: 'background 0.2s',
          }}
        >
          Registreeru
        </button>
      </div>
      {tab === 'login' ? <Login /> : <Register />}
    </div>
  );
};

export default AuthPage; 