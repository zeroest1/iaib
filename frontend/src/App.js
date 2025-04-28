// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NotificationForm from './components/notifications/NotificationForm';
import NotificationList from './components/notifications/NotificationList';
import NotificationDetail from './components/notifications/NotificationDetail';
import NotificationEdit from './components/notifications/NotificationEdit';
import AuthPage from './components/auth/AuthPage';
import DashboardLayout from './components/DashboardLayout';
import Login from './components/auth/Login';
import Register from './components/auth/Register';



function App() {
  return (
    <Router>
      <div>
        <h1>Teavitussüsteem</h1>
        <Routes>
          <Route path="/register" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route path="/" element={<DashboardLayout><NotificationList /></DashboardLayout>} />
          <Route path="/add" element={<DashboardLayout><NotificationForm /></DashboardLayout>} />
          <Route path="/notifications/:id" element={<DashboardLayout><NotificationDetail /></DashboardLayout>} />
          <Route path="/notifications/:id/edit" element={<DashboardLayout><NotificationEdit /></DashboardLayout>} />
          <Route path="/favorites" element={<DashboardLayout><NotificationList showFavoritesOnly={true} /></DashboardLayout>} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
