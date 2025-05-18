import React from 'react';
import { MdSearch, MdClear } from 'react-icons/md';
import MultiSelectDropdown from './MultiSelectDropdown';
import { NOTIFICATION_CATEGORIES, NOTIFICATION_PRIORITIES } from './constants';
import './styles/NotificationFilters.css';

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
  const hasActiveFilters = searchTerm.trim() !== '' || 
                           selectedCategories.length > 0 || 
                           selectedPriorities.length > 0;
  
  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategories([]);
    setSelectedPriorities([]);
  };
  
  return (
    <div className="filters-container">
      <div className="filters-row">
        {hasActiveFilters && (
          <button 
            className="reset-filters-btn"
            onClick={handleResetFilters}
            title="Eemalda kõik filtrid"
          >
            <MdClear /> Lähtesta
          </button>
        )}
        <div className="search-wrapper">
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
      </div>

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