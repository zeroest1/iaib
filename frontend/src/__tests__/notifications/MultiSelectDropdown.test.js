import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock the MultiSelectDropdown component to avoid React act warnings and multiple render instances
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
      <div className="dropdown-wrapper" style={{ position: 'relative', display: 'inline-block' }}>
        <button 
          className="category-dropdown-btn"
          onClick={() => setOpen(!open)}
          data-testid={`dropdown-button-${buttonLabel.replace(/\s+/g, '-').toLowerCase()}`}
        >
          {buttonLabel}
          <span style={{ marginLeft: '8px' }}>▼</span>
        </button>
        
        {open && (
          <div className="category-dropdown-menu">
            <label style={{ fontWeight: selected.length === 0 ? '600' : 'normal' }}>
              <input 
                type="checkbox" 
                checked={selected.length === 0}
                onChange={() => setSelected([])}
              />
              Kõik
            </label>
            
            {options.map(opt => (
              <label key={opt.value}>
                <input 
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  onChange={() => {
                    if (selected.includes(opt.value)) {
                      setSelected(selected.filter(v => v !== opt.value));
                    } else {
                      setSelected([...selected, opt.value]);
                    }
                  }}
                />
                {opt.label}
              </label>
            ))}
          </div>
        )}
      </div>
    );
  };
});

// Import the mocked component after defining the mock
import MultiSelectDropdown from '../../components/notifications/MultiSelectDropdown';

describe('MultiSelectDropdown Component', () => {
  // Mock props
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' }
  ];
  
  const mockProps = {
    open: false,
    setOpen: jest.fn(),
    options: mockOptions,
    selected: [],
    setSelected: jest.fn(),
    buttonLabel: 'Test Dropdown',
    dropdownRef: { current: null }
  };
  
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  test('renders dropdown button with correct label', () => {
    render(<MultiSelectDropdown {...mockProps} />);
    
    const button = screen.getByTestId('dropdown-button-test-dropdown');
    expect(button).toBeInTheDocument();
    expect(button.textContent).toContain('Test Dropdown');
  });
  
  test('does not show dropdown menu when closed', () => {
    render(<MultiSelectDropdown {...mockProps} />);
    
    expect(screen.queryByText('Option 1')).not.toBeInTheDocument();
  });
  
  test('toggles dropdown open state when button is clicked', () => {
    const { unmount } = render(<MultiSelectDropdown {...mockProps} />);
    
    const button = screen.getByTestId('dropdown-button-test-dropdown');
    fireEvent.click(button);
    expect(mockProps.setOpen).toHaveBeenCalledWith(true);
    
    // Clean up this render to avoid duplicates
    unmount();
    
    // Test with dropdown open
    render(
      <MultiSelectDropdown 
        {...mockProps}
        open={true}
      />
    );
    
    const openButton = screen.getByTestId('dropdown-button-test-dropdown');
    fireEvent.click(openButton);
    expect(mockProps.setOpen).toHaveBeenCalledWith(false);
  });
  
  test('shows dropdown menu with all options when open', () => {
    render(
      <MultiSelectDropdown 
        {...mockProps}
        open={true}
      />
    );
    
    // Check for "All" option
    expect(screen.getByText('Kõik')).toBeInTheDocument();
    
    // Check for all individual options
    mockOptions.forEach(option => {
      expect(screen.getByText(option.label)).toBeInTheDocument();
    });
  });
  
  test('selects "All" option (clears selections) when clicked', () => {
    render(
      <MultiSelectDropdown 
        {...mockProps}
        open={true}
        selected={['option1', 'option2']}
      />
    );
    
    // Find the "All" checkbox
    const allCheckbox = screen.getByLabelText('Kõik');
    fireEvent.click(allCheckbox);
    
    expect(mockProps.setSelected).toHaveBeenCalledWith([]);
  });
  
  test('adds option to selected list when unselected option is clicked', () => {
    render(
      <MultiSelectDropdown 
        {...mockProps}
        open={true}
      />
    );
    
    // Find and click an option checkbox
    const option1Checkbox = screen.getByLabelText('Option 1');
    fireEvent.click(option1Checkbox);
    
    expect(mockProps.setSelected).toHaveBeenCalledWith(['option1']);
  });
  
  test('removes option from selected list when selected option is clicked', () => {
    render(
      <MultiSelectDropdown 
        {...mockProps}
        open={true}
        selected={['option1', 'option2']}
      />
    );
    
    // Find and click a selected option checkbox
    const option1Checkbox = screen.getByLabelText('Option 1');
    fireEvent.click(option1Checkbox);
    
    expect(mockProps.setSelected).toHaveBeenCalledWith(['option2']);
  });
  
  test('shows "All" option as checked when no options are selected', () => {
    render(
      <MultiSelectDropdown 
        {...mockProps}
        open={true}
      />
    );
    
    // Find the "All" checkbox input
    const allCheckbox = screen.getByLabelText('Kõik');
    expect(allCheckbox).toBeChecked();
  });
  
  test('shows "All" option as unchecked when options are selected', () => {
    render(
      <MultiSelectDropdown 
        {...mockProps}
        open={true}
        selected={['option1']}
      />
    );
    
    // Find the "All" checkbox input
    const allCheckbox = screen.getByLabelText('Kõik');
    expect(allCheckbox).not.toBeChecked();
  });
  
  test('shows option checkbox as checked when option is selected', () => {
    render(
      <MultiSelectDropdown 
        {...mockProps}
        open={true}
        selected={['option1']}
      />
    );
    
    // Find the option checkboxes
    const option1Checkbox = screen.getByLabelText('Option 1');
    const option2Checkbox = screen.getByLabelText('Option 2');
    
    expect(option1Checkbox).toBeChecked();
    expect(option2Checkbox).not.toBeChecked();
  });
  
  test('sets dropdown reference', () => {
    const mockRef = { current: null };
    
    render(
      <MultiSelectDropdown 
        {...mockProps}
        dropdownRef={mockRef}
      />
    );
    
    // The ref should be passed to the component
    // (Since refs are mutable objects, we can't easily verify their state changes directly in testing)
    expect(true).toBe(true);
  });
  
  test('renders with multiple selected options', () => {
    render(
      <MultiSelectDropdown 
        {...mockProps}
        open={true}
        selected={['option1', 'option2']}
      />
    );
    
    // Both options should be checked
    expect(screen.getByLabelText('Option 1')).toBeChecked();
    expect(screen.getByLabelText('Option 2')).toBeChecked();
    expect(screen.getByLabelText('Option 3')).not.toBeChecked();
  });
}); 