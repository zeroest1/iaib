import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NotificationForm from './components/notifications/NotificationForm';
import NotificationList from './components/notifications/NotificationList';
import NotificationDetail from './components/notifications/NotificationDetail';
import NotificationEdit from './components/notifications/NotificationEdit';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import AuthPage from './components/auth/AuthPage';
import DashboardLayout from './layout/DashboardLayout';
import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div>
          <h1>Teavitussüsteem</h1>
          <Routes>
            <Route path="/register" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<DashboardLayout><NotificationList /></DashboardLayout>} />
              <Route path="/add" element={<DashboardLayout><NotificationForm /></DashboardLayout>} />
              <Route path="/notifications/:id" element={<DashboardLayout><NotificationDetail /></DashboardLayout>} />
              <Route path="/notifications/:id/edit" element={<DashboardLayout><NotificationEdit /></DashboardLayout>} />
              <Route path="/favorites" element={<DashboardLayout><NotificationList showFavoritesOnly={true} /></DashboardLayout>} />
            </Route>
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 