import React from 'react';
import MultiSelectDropdown from './MultiSelectDropdown';
import { NOTIFICATION_CATEGORIES, NOTIFICATION_PRIORITIES } from './constants';

const NotificationFilters = ({ 
  selectedCategories, 
  setSelectedCategories, 
  selectedPriorities, 
  setSelectedPriorities,
  dropdownOpen,
  setDropdownOpen,
  priorityDropdownOpen,
  setPriorityDropdownOpen,
  dropdownRef,
  priorityDropdownRef,
  filteredCount,
  filterDescription,
  unreadCount
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'row', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div className="notification-count">
          <span className="filter-description">{filterDescription}</span>
          <span className="count">{filteredCount}</span>
          {unreadCount > 0 && (
            <span className="unread-badge" title="Lugemata teateid">{unreadCount}</span>
          )}
        </div>
      </div>
      <MultiSelectDropdown
        open={dropdownOpen}
        setOpen={setDropdownOpen}
        options={NOTIFICATION_CATEGORIES}
        selected={selectedCategories}
        setSelected={setSelectedCategories}
        buttonLabel="Vali kategooriad"
        dropdownRef={dropdownRef}
      />
      <MultiSelectDropdown
        open={priorityDropdownOpen}
        setOpen={setPriorityDropdownOpen}
        options={NOTIFICATION_PRIORITIES}
        selected={selectedPriorities}
        setSelected={setSelectedPriorities}
        buttonLabel="Vali prioriteedid"
        dropdownRef={priorityDropdownRef}
      />
    </div>
  );
};

export default NotificationFilters; 