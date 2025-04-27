// src/App.js
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import NotificationForm from './components/NotificationForm';
import NotificationList from './components/NotificationList';
import NotificationDetail from './components/NotificationDetail';
import NotificationEdit from './components/NotificationEdit';



function App() {
  return (
    <Router>
      <div>
        <h1>Teavitussüsteem</h1>
        <Routes>
          <Route path="/" element={<NotificationList />} />
          <Route path="/add" element={<NotificationForm />} />
          <Route path="/notifications/:id" element={<NotificationDetail />} />
          <Route path="/notifications/:id/edit" element={<NotificationEdit />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
