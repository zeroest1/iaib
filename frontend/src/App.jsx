import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import NotificationForm from './components/notifications/NotificationForm';
import NotificationList from './components/notifications/NotificationList';
import NotificationDetail from './components/notifications/NotificationDetail';
import NotificationEdit from './components/notifications/NotificationEdit';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AuthPage from './components/auth/AuthPage';
import DashboardLayout from './layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleProtectedRoute from './components/auth/RoleProtectedRoute';
import { useGetMeQuery } from './services/api';
import './App.css';

function App() {
  // Load user data on app initialization
  useGetMeQuery();

  return (
    <Router>
      <div className="app-container">
        <Routes>
          <Route path="/register" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />
          <Route element={<ProtectedRoute />}>
            {/* Main notification views - same for both roles */}
            <Route path="/" element={<DashboardLayout><NotificationList /></DashboardLayout>} />
            <Route path="/favorites" element={<DashboardLayout><NotificationList showFavoritesOnly={true} /></DashboardLayout>} />
            <Route path="/notifications/:id" element={<DashboardLayout><NotificationDetail /></DashboardLayout>} />
          </Route>
          
          {/* Program manager specific routes */}
          <Route element={<RoleProtectedRoute allowedRoles={['programmijuht']} />}>
            <Route path="/my-notifications" element={<DashboardLayout><NotificationList showMyNotifications={true} /></DashboardLayout>} />
            <Route path="/add" element={<DashboardLayout><NotificationForm /></DashboardLayout>} />
            <Route path="/notifications/:id/edit" element={<DashboardLayout><NotificationEdit /></DashboardLayout>} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App; 