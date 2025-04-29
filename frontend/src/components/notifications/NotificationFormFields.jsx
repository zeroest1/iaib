import React from 'react';
import { NOTIFICATION_CATEGORIES, NOTIFICATION_PRIORITIES } from './constants';
import './styles/NotificationForm.css';

const NotificationFormFields = ({ 
  formData, 
  handleChange, 
  error, 
  isSubmitting, 
  submitButtonText, 
  loadingText 
}) => {
  return (
    <>
      <div className="form-group">
        <label htmlFor="title">Pealkiri</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          className="form-input"
          placeholder="Sisesta pealkiri"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="content">Sisu</label>
        <textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          className="form-textarea"
          placeholder="Sisesta teate sisu"
          required
        />
      </div>
      <div className="form-group">
        <label htmlFor="category">Kategooria</label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          className="form-select"
          required
        >
          <option value="">Vali kategooria</option>
          {NOTIFICATION_CATEGORIES.map(category => (
            <option key={category.value} value={category.value}>
              {category.label}
            </option>
          ))}
        </select>
      </div>
      <div className="form-group">
        <label htmlFor="priority">Prioriteet</label>
        <select
          id="priority"
          name="priority"
          value={formData.priority}
          onChange={handleChange}
          className="form-select"
          required
        >
          {NOTIFICATION_PRIORITIES.map(priority => (
            <option key={priority.value} value={priority.value}>
              {priority.label}
            </option>
          ))}
        </select>
      </div>
      {error && <p className="error-message">{error}</p>}
      <button type="submit" className="submit-button" disabled={isSubmitting}>
        {isSubmitting ? loadingText : submitButtonText}
      </button>
    </>
  );
};

export default NotificationFormFields; 