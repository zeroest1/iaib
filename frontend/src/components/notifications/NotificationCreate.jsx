import React, { useState } from 'react';
import API from '../../services/api';

function NotificationCreate() {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleSubmit = async (e) => {
    e.preventDefault();
    await API.post('/notifications', {
      title,
      content,
      category: 'general',
      priority,
      created_by: 1, // временно статично
    });
    setTitle('');
    setContent('');
    alert('Notification created!');
  };

  return (
    <div>
      <h2>Create Notification</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        /><br/>
        <textarea
          placeholder="Content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          required
        ></textarea><br/>
        <select value={priority} onChange={(e) => setPriority(e.target.value)}>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select><br/>
        <button type="submit">Send</button>
      </form>
    </div>
  );
}

export default NotificationCreate;
