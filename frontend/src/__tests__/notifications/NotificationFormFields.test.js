/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import NotificationFormFields from '../../components/notifications/NotificationFormFields';

// Mock the constants to avoid importing the real ones
jest.mock('../../components/notifications/constants', () => ({
  NOTIFICATION_CATEGORIES: [
    { value: 'õppetöö', label: 'Õppetöö' },
    { value: 'hindamine', label: 'Hindamine' },
  ],
  NOTIFICATION_PRIORITIES: [
    { value: 'kiire', label: 'Kiire' },
    { value: 'kõrge', label: 'Kõrge' },
    { value: 'tavaline', label: 'Tavaline' },
    { value: 'madal', label: 'Madal' },
  ],
}));

describe('NotificationFormFields Component', () => {
  // Sample props for testing
  const defaultProps = {
    formData: {
      title: 'Test Title',
      content: 'Test Content',
      category: 'õppetöö',
      priority: 'tavaline',
    },
    handleChange: jest.fn(),
    error: '',
    isSubmitting: false,
    submitButtonText: 'Submit',
    loadingText: 'Loading...',
    availableGroups: [
      { id: 1, name: 'Group 1', is_role_group: false },
      { id: 2, name: 'Group 2', is_role_group: true },
    ],
    selectedGroups: [],
    handleGroupChange: jest.fn(),
    showGroupSelection: true,
  };

  test('renders form fields with correct values', () => {
    render(<NotificationFormFields {...defaultProps} />);
    
    // Check title field
    const titleInput = screen.getByLabelText('Pealkiri');
    expect(titleInput).toBeInTheDocument();
    expect(titleInput.value).toBe('Test Title');
    
    // Check content field
    const contentTextarea = screen.getByLabelText('Sisu');
    expect(contentTextarea).toBeInTheDocument();
    expect(contentTextarea.value).toBe('Test Content');
    
    // Check category dropdown
    const categorySelect = screen.getByLabelText('Kategooria');
    expect(categorySelect).toBeInTheDocument();
    expect(categorySelect.value).toBe('õppetöö');
    
    // Check priority dropdown
    const prioritySelect = screen.getByLabelText('Prioriteet');
    expect(prioritySelect).toBeInTheDocument();
    expect(prioritySelect.value).toBe('tavaline');
    
    // Check submit button
    const submitButton = screen.getByText('Submit');
    expect(submitButton).toBeInTheDocument();
  });

  test('renders groups section when showGroupSelection is true', () => {
    render(<NotificationFormFields {...defaultProps} />);
    
    // Check that groups section is rendered
    expect(screen.getByText('Sihtgrupid')).toBeInTheDocument();
    expect(screen.getByText('Kõik grupid (avalik)')).toBeInTheDocument();
    expect(screen.getByText('Group 1')).toBeInTheDocument();
    expect(screen.getByText('Group 2')).toBeInTheDocument();
  });

  test('does not render groups section when showGroupSelection is false', () => {
    render(
      <NotificationFormFields
        {...defaultProps}
        showGroupSelection={false}
      />
    );
    
    // Check that groups section is not rendered
    expect(screen.queryByText('Sihtgrupid')).not.toBeInTheDocument();
    expect(screen.queryByText('Kõik grupid (avalik)')).not.toBeInTheDocument();
  });

  test('calls handleChange when input values change', () => {
    render(<NotificationFormFields {...defaultProps} />);
    
    // Change title input
    const titleInput = screen.getByLabelText('Pealkiri');
    fireEvent.change(titleInput, { target: { value: 'Updated Title' } });
    expect(defaultProps.handleChange).toHaveBeenCalled();
    
    // Change content textarea
    const contentTextarea = screen.getByLabelText('Sisu');
    fireEvent.change(contentTextarea, { target: { value: 'Updated Content' } });
    expect(defaultProps.handleChange).toHaveBeenCalled();
    
    // Change category dropdown
    const categorySelect = screen.getByLabelText('Kategooria');
    fireEvent.change(categorySelect, { target: { value: 'hindamine' } });
    expect(defaultProps.handleChange).toHaveBeenCalled();
    
    // Change priority dropdown
    const prioritySelect = screen.getByLabelText('Prioriteet');
    fireEvent.change(prioritySelect, { target: { value: 'kõrge' } });
    expect(defaultProps.handleChange).toHaveBeenCalled();
  });

  test('calls handleGroupChange when group selection changes', () => {
    render(<NotificationFormFields {...defaultProps} />);
    
    // Select the first group
    const group1Checkbox = screen.getByLabelText('Group 1');
    fireEvent.click(group1Checkbox);
    expect(defaultProps.handleGroupChange).toHaveBeenCalled();
  });

  test('shows "select all" checkbox checked when no groups are selected', () => {
    render(<NotificationFormFields {...defaultProps} />);
    
    const selectAllCheckbox = screen.getByLabelText('Kõik grupid (avalik)');
    expect(selectAllCheckbox).toBeChecked();
  });

  test('shows "select all" checkbox unchecked when groups are selected', () => {
    render(
      <NotificationFormFields
        {...defaultProps}
        selectedGroups={[1]}
      />
    );
    
    const selectAllCheckbox = screen.getByLabelText('Kõik grupid (avalik)');
    expect(selectAllCheckbox).not.toBeChecked();
  });

  test('displays error message when error prop is provided', () => {
    render(
      <NotificationFormFields
        {...defaultProps}
        error="Test error message"
      />
    );
    
    expect(screen.getByText('Test error message')).toBeInTheDocument();
  });

  test('disables submit button when isSubmitting is true', () => {
    render(
      <NotificationFormFields
        {...defaultProps}
        isSubmitting={true}
      />
    );
    
    const submitButton = screen.getByText('Loading...');
    expect(submitButton).toBeDisabled();
  });

  test('renders role groups and regular groups in separate sections', () => {
    render(<NotificationFormFields {...defaultProps} />);
    
    // Check that role groups and regular groups are in separate sections
    expect(screen.getByText('Rollipõhised grupid')).toBeInTheDocument();
    expect(screen.getByText('Regulaarsed grupid')).toBeInTheDocument();
  });

  test('handles search filtering of groups', () => {
    render(<NotificationFormFields {...defaultProps} />);
    
    // Get the search input
    const searchInput = screen.getByPlaceholderText('Otsi gruppe...');
    
    // Enter search term
    fireEvent.change(searchInput, { target: { value: 'Group 1' } });
    
    // Group 1 should be visible, Group 2 should be filtered out (but still in the DOM)
    const group1Label = screen.getByLabelText('Group 1');
    expect(group1Label).toBeInTheDocument();
    
    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // Both groups should be visible again
    const group2Label = screen.getByLabelText('Group 2');
    expect(group2Label).toBeInTheDocument();
  });

  test('shows appropriate hint text based on group selection', () => {
    // Test with no groups selected
    render(<NotificationFormFields {...defaultProps} />);
    
    expect(screen.getByText('Teade on nähtav kõigile kasutajatele')).toBeInTheDocument();
    
    // Test with groups selected
    render(
      <NotificationFormFields
        {...defaultProps}
        selectedGroups={[1]}
      />
    );
    
    expect(screen.getByText('Teade on nähtav ainult valitud gruppidele')).toBeInTheDocument();
  });

  test('shows no groups found message when search has no results', () => {
    render(<NotificationFormFields {...defaultProps} />);
    
    // Get the search input
    const searchInput = screen.getByPlaceholderText('Otsi gruppe...');
    
    // Enter search term that won't match any groups
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });
    
    // Should show no groups found message
    expect(screen.getByText(/Ei leidnud ühtegi gruppi otsingule/)).toBeInTheDocument();
  });
}); 