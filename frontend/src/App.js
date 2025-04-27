// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NotificationForm from './components/NotificationForm';
import NotificationList from './components/NotificationList';
import NotificationDetail from './components/NotificationDetail';
import NotificationEdit from './components/NotificationEdit';
import Login from './components/Login';
import Register from './components/Register';
import AuthPage from './components/AuthPage';
import DashboardLayout from './components/DashboardLayout';



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
