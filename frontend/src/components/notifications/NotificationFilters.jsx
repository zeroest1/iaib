import React from 'react';
import { MdSearch } from 'react-icons/md';
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
  unreadCount,
  searchTerm,
  setSearchTerm
}) => {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      <div className="search-container">
        <MdSearch className="search-icon" />
        <input
          type="text"
          placeholder="Otsi teateid..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      <MultiSelectDropdown
        open={dropdownOpen}
        setOpen={setDropdownOpen}
        options={NOTIFICATION_CATEGORIES}
        selected={selectedCategories}
        setSelected={setSelectedCategories}
        buttonLabel="Kategooria"
        dropdownRef={dropdownRef}
      />
      <MultiSelectDropdown
        open={priorityDropdownOpen}
        setOpen={setPriorityDropdownOpen}
        options={NOTIFICATION_PRIORITIES}
        selected={selectedPriorities}
        setSelected={setSelectedPriorities}
        buttonLabel="Prioriteet"
        dropdownRef={priorityDropdownRef}
      />
      <div className="notification-count">
        {filterDescription && (
          <span className="filter-description">{filterDescription}</span>
        )}
        <span className="count">
          {filteredCount} {filteredCount !== 1 ? 'teadet' : 'teade'}
          {unreadCount > 0 && (
            <span className="unread-badge" title="Lugemata teateid">
              {unreadCount}
            </span>
          )}
        </span>
      </div>
    </div>
  );
};

export default NotificationFilters; 