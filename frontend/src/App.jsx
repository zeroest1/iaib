import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NotificationForm from './components/notifications/NotificationForm';
import NotificationList from './components/notifications/NotificationList';
import NotificationDetail from './components/notifications/NotificationDetail';
import NotificationEdit from './components/notifications/NotificationEdit';
import AuthPage from './components/auth/AuthPage';
import DashboardLayout from './layout/DashboardLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import RoleProtectedRoute from './components/auth/RoleProtectedRoute';
import { useGetMeQuery } from './services/api';
import TemplateList from './components/templates/TemplateList';
import './App.css';

/**
 * Main application component
 * Sets up routing structure with authentication protection
 * Defines routes for different user roles
 */
function App() {
  // Load user data on app initialization
  useGetMeQuery();

  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Public routes */}
          <Route path="/register" element={<AuthPage />} />
          <Route path="/login" element={<AuthPage />} />
          
          {/* Protected routes for authenticated users */}
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<DashboardLayout><NotificationList /></DashboardLayout>} />
            <Route path="/favorites" element={<DashboardLayout><NotificationList /></DashboardLayout>} />
            <Route path="/notifications/:id" element={<DashboardLayout><NotificationDetail /></DashboardLayout>} />
          </Route>
          
          {/* Routes restricted to program manager role */}
          <Route element={<RoleProtectedRoute allowedRoles={['programmijuht']} />}>
            <Route path="/my-notifications" element={<DashboardLayout><NotificationList /></DashboardLayout>} />
            <Route path="/add-notification" element={<DashboardLayout><NotificationForm /></DashboardLayout>} />
            <Route path="/notifications/new" element={<DashboardLayout><NotificationForm /></DashboardLayout>} />
            <Route path="/notifications/:id/edit" element={<DashboardLayout><NotificationEdit /></DashboardLayout>} />
            <Route path="/templates" element={<DashboardLayout><TemplateList /></DashboardLayout>} />
            <Route path="/templates/new" element={<DashboardLayout><NotificationForm isTemplate={true} /></DashboardLayout>} />
            <Route path="/templates/edit/:id" element={<DashboardLayout><NotificationForm isTemplate={true} isEdit={true} /></DashboardLayout>} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App; 