import React, { useState } from 'react';
import { NOTIFICATION_CATEGORIES, NOTIFICATION_PRIORITIES } from './constants';
import './styles/NotificationForm.css';

const NotificationFormFields = ({ 
  formData, 
  handleChange, 
  error, 
  isSubmitting, 
  submitButtonText, 
  loadingText,
  availableGroups,
  selectedGroups,
  handleGroupChange
}) => {
  const [groupSearchTerm, setGroupSearchTerm] = useState('');
  
  // Separate role groups from regular groups
  const roleGroups = availableGroups ? availableGroups.filter(g => g.is_role_group) : [];
  const regularGroups = availableGroups ? availableGroups.filter(g => !g.is_role_group) : [];
  
  // Filter groups based on search term
  const filteredRoleGroups = groupSearchTerm 
    ? roleGroups.filter(g => g.name.toLowerCase().includes(groupSearchTerm.toLowerCase()))
    : roleGroups;
    
  const filteredRegularGroups = groupSearchTerm 
    ? regularGroups.filter(g => g.name.toLowerCase().includes(groupSearchTerm.toLowerCase()))
    : regularGroups;

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
      <div className="form-group">
        <label htmlFor="targetGroups">Sihtgrupid</label>
        
        <div className="group-search-container">
          <input
            type="text"
            placeholder="Otsi gruppe..."
            value={groupSearchTerm}
            onChange={(e) => setGroupSearchTerm(e.target.value)}
            className="group-search-input"
          />
        </div>
        
        <div className="checkbox-group">
          <div className="checkbox-item">
            <input
              type="checkbox"
              id="select-all-groups"
              name="select-all-groups"
              checked={selectedGroups.length === 0}
              onChange={() => handleGroupChange([])}
            />
            <label htmlFor="select-all-groups">Kõik grupid (avalik)</label>
          </div>
          
          {/* Role groups section */}
          {filteredRoleGroups.length > 0 && (
            <div className="group-section">
              <h4>Rollipõhised grupid {groupSearchTerm && filteredRoleGroups.length !== roleGroups.length && `(${filteredRoleGroups.length}/${roleGroups.length})`}</h4>
              {filteredRoleGroups.map(group => (
                <div key={group.id} className="checkbox-item role-group-item">
                  <input
                    type="checkbox"
                    id={`group-${group.id}`}
                    name={`group-${group.id}`}
                    value={group.id}
                    checked={selectedGroups.includes(group.id)}
                    onChange={(e) => {
                      const groupId = parseInt(e.target.value, 10);
                      if (selectedGroups.includes(groupId)) {
                        handleGroupChange(selectedGroups.filter(id => id !== groupId));
                      } else {
                        handleGroupChange([...selectedGroups, groupId]);
                      }
                    }}
                  />
                  <label htmlFor={`group-${group.id}`}>{group.name}</label>
                </div>
              ))}
            </div>
          )}
          
          {/* Regular groups section */}
          {filteredRegularGroups.length > 0 && (
            <div className="group-section">
              <h4>Regulaarsed grupid {groupSearchTerm && filteredRegularGroups.length !== regularGroups.length && `(${filteredRegularGroups.length}/${regularGroups.length})`}</h4>
              {filteredRegularGroups.map(group => (
                <div key={group.id} className="checkbox-item">
                  <input
                    type="checkbox"
                    id={`group-${group.id}`}
                    name={`group-${group.id}`}
                    value={group.id}
                    checked={selectedGroups.includes(group.id)}
                    onChange={(e) => {
                      const groupId = parseInt(e.target.value, 10);
                      if (selectedGroups.includes(groupId)) {
                        handleGroupChange(selectedGroups.filter(id => id !== groupId));
                      } else {
                        handleGroupChange([...selectedGroups, groupId]);
                      }
                    }}
                  />
                  <label htmlFor={`group-${group.id}`}>{group.name}</label>
                </div>
              ))}
            </div>
          )}
          
          {groupSearchTerm && filteredRoleGroups.length === 0 && filteredRegularGroups.length === 0 && (
            <div className="no-groups-found">
              Ei leidnud ühtegi gruppi otsingule: "{groupSearchTerm}"
            </div>
          )}
        </div>
        <div className="groups-info">
          {selectedGroups.length === 0 ? (
            <span className="groups-hint">Teade on nähtav kõigile kasutajatele</span>
          ) : (
            <span className="groups-hint">Teade on nähtav ainult valitud gruppidele</span>
          )}
        </div>
      </div>
      {error && <p className="error-message">{error}</p>}
      <button type="submit" className="submit-button" disabled={isSubmitting}>
        {isSubmitting ? loadingText : submitButtonText}
      </button>
    </>
  );
};

export default NotificationFormFields; 