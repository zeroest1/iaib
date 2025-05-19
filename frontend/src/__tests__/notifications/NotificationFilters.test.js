import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationFilters from '../../components/notifications/NotificationFilters';
import { NOTIFICATION_CATEGORIES, NOTIFICATION_PRIORITIES } from '../../components/notifications/constants';

// Mock react-icons
jest.mock('react-icons/md', () => ({
  MdSearch: () => <span data-testid="search-icon">SearchIcon</span>,
  MdClear: () => <span data-testid="clear-icon">ClearIcon</span>
}));

// Mock MultiSelectDropdown for easier testing
jest.mock('../../components/notifications/MultiSelectDropdown', () => {
  return function MockMultiSelectDropdown({ 
    buttonLabel, 
    open, 
    setOpen, 
    selected, 
    setSelected, 
    options 
  }) {
    return (
      <div data-testid={`dropdown-${buttonLabel.toLowerCase()}`}>
        <button 
          onClick={() => setOpen(!open)}
          data-testid={`dropdown-button-${buttonLabel.toLowerCase()}`}
        >
          {buttonLabel} (Selected: {selected.length})
        </button>
        {open && (
          <div data-testid={`dropdown-content-${buttonLabel.toLowerCase()}`}>
            <button 
              data-testid={`select-all-${buttonLabel.toLowerCase()}`}
              onClick={() => setSelected([])}
            >
              Kõik
            </button>
            {options.map(opt => (
              <button 
                key={opt.value}
                data-testid={`option-${opt.value}`}
                onClick={() => {
                  if (selected.includes(opt.value)) {
                    setSelected(selected.filter(v => v !== opt.value));
                  } else {
                    setSelected([...selected, opt.value]);
                  }
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };
});

describe('NotificationFilters Component', () => {
  // Default props
  const mockProps = {
    selectedCategories: [],
    setSelectedCategories: jest.fn(),
    selectedPriorities: [],
    setSelectedPriorities: jest.fn(),
    dropdownOpen: false,
    setDropdownOpen: jest.fn(),
    priorityDropdownOpen: false,
    setPriorityDropdownOpen: jest.fn(),
    dropdownRef: { current: null },
    priorityDropdownRef: { current: null },
    filteredCount: 10,
    unreadCount: 3,
    searchTerm: '',
    setSearchTerm: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders search input with correct placeholder', () => {
    render(<NotificationFilters {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Otsi teateid...');
    expect(searchInput).toBeInTheDocument();
    expect(searchInput.value).toBe('');
  });

  test('updates search term when typing', () => {
    render(<NotificationFilters {...mockProps} />);
    
    const searchInput = screen.getByPlaceholderText('Otsi teateid...');
    fireEvent.change(searchInput, { target: { value: 'test search' } });
    
    expect(mockProps.setSearchTerm).toHaveBeenCalledWith('test search');
  });

  test('renders category dropdown', () => {
    render(<NotificationFilters {...mockProps} />);
    
    expect(screen.getByTestId('dropdown-kategooria')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-button-kategooria')).toHaveTextContent('Kategooria');
  });

  test('renders priority dropdown', () => {
    render(<NotificationFilters {...mockProps} />);
    
    expect(screen.getByTestId('dropdown-prioriteet')).toBeInTheDocument();
    expect(screen.getByTestId('dropdown-button-prioriteet')).toHaveTextContent('Prioriteet');
  });

  test('shows filtered count', () => {
    render(<NotificationFilters {...mockProps} />);
    
    expect(screen.getByText('10 teadet')).toBeInTheDocument();
  });

  test('shows singular form when filteredCount is 1', () => {
    render(
      <NotificationFilters 
        {...mockProps}
        filteredCount={1}
      />
    );
    
    expect(screen.getByText('1 teade')).toBeInTheDocument();
  });

  test('shows unread badge when unreadCount > 0', () => {
    render(<NotificationFilters {...mockProps} />);
    
    const unreadBadge = screen.getByTitle('Lugemata teateid');
    expect(unreadBadge).toBeInTheDocument();
    expect(unreadBadge).toHaveTextContent('3');
  });

  test('does not show unread badge when unreadCount = 0', () => {
    render(
      <NotificationFilters 
        {...mockProps}
        unreadCount={0}
      />
    );
    
    expect(screen.queryByTitle('Lugemata teateid')).not.toBeInTheDocument();
  });

  test('does not show reset button when no filters active', () => {
    render(<NotificationFilters {...mockProps} />);
    
    expect(screen.queryByText('Lähtesta')).not.toBeInTheDocument();
  });

  test('shows reset button when search term is active', () => {
    render(
      <NotificationFilters 
        {...mockProps}
        searchTerm="test search"
      />
    );
    
    expect(screen.getByText('Lähtesta')).toBeInTheDocument();
  });

  test('shows reset button when categories are selected', () => {
    render(
      <NotificationFilters 
        {...mockProps}
        selectedCategories={['õppetöö']}
      />
    );
    
    expect(screen.getByText('Lähtesta')).toBeInTheDocument();
  });

  test('shows reset button when priorities are selected', () => {
    render(
      <NotificationFilters 
        {...mockProps}
        selectedPriorities={['kiire']}
      />
    );
    
    expect(screen.getByText('Lähtesta')).toBeInTheDocument();
  });

  test('resets all filters when reset button is clicked', () => {
    render(
      <NotificationFilters 
        {...mockProps}
        searchTerm="test search"
        selectedCategories={['õppetöö']}
        selectedPriorities={['kiire']}
      />
    );
    
    fireEvent.click(screen.getByText('Lähtesta'));
    
    expect(mockProps.setSearchTerm).toHaveBeenCalledWith('');
    expect(mockProps.setSelectedCategories).toHaveBeenCalledWith([]);
    expect(mockProps.setSelectedPriorities).toHaveBeenCalledWith([]);
  });

  test('opens category dropdown when button is clicked', () => {
    render(<NotificationFilters {...mockProps} />);
    
    fireEvent.click(screen.getByTestId('dropdown-button-kategooria'));
    
    expect(mockProps.setDropdownOpen).toHaveBeenCalledWith(true);
  });

  test('opens priority dropdown when button is clicked', () => {
    render(<NotificationFilters {...mockProps} />);
    
    fireEvent.click(screen.getByTestId('dropdown-button-prioriteet'));
    
    expect(mockProps.setPriorityDropdownOpen).toHaveBeenCalledWith(true);
  });

  test('displays filter description when provided', () => {
    render(
      <NotificationFilters 
        {...mockProps}
        filterDescription="Test filter description"
      />
    );
    
    expect(screen.getByText('Test filter description')).toBeInTheDocument();
  });
}); 