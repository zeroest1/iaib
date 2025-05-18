/**
 * Application entry point
 * Sets up React with Redux store and renders root component
 */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import './fonts.css';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { store } from './store';

// Create root and render app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>
);

// Initialize performance metrics
reportWebVitals();
