import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import Register from '../../components/auth/Register';

// Mock navigate
const mockNavigate = jest.fn();

// Use the global mock for react-router-dom but override useNavigate
jest.mock('react-router-dom', () => {
  const originalModule = jest.requireActual('../../__mocks__/react-router-dom');
  return {
    ...originalModule,
    useNavigate: () => mockNavigate
  };
});

// Mock the RTK Query hooks
jest.mock('../../services/api');

describe('Register Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  afterEach(() => {
    cleanup();
  });
  
  test('renders registration form with all fields and groups', () => {
    render(<Register />);
    
    // Check for form elements
    expect(screen.getByLabelText(/nimi/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/parool/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/roll/i)).toBeInTheDocument();
    expect(screen.getByText(/grupid/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /registreeru/i })).toBeInTheDocument();
    
    // Check that groups are rendered
    expect(screen.getByText('Group 1')).toBeInTheDocument();
    expect(screen.getByText('Group 2')).toBeInTheDocument();
    expect(screen.getByText('First group', { exact: false })).toBeInTheDocument();
    expect(screen.getByText('Second group', { exact: false })).toBeInTheDocument();
  });
  
  test('handles input changes correctly for text fields', () => {
    render(<Register />);
    
    // Fill the text fields
    fireEvent.change(screen.getByLabelText(/nimi/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/parool/i), { target: { value: 'password123' } });
    
    // Check the values
    expect(screen.getByLabelText(/nimi/i)).toHaveValue('Test User');
    expect(screen.getByLabelText(/email/i)).toHaveValue('test@example.com');
    expect(screen.getByLabelText(/parool/i)).toHaveValue('password123');
  });
  
  test('handles role selection changes', () => {
    render(<Register />);
    
    // Default role should be "tudeng"
    expect(screen.getByLabelText(/roll/i)).toHaveValue('tudeng');
    
    // Change role to "programmijuht"
    fireEvent.change(screen.getByLabelText(/roll/i), { target: { value: 'programmijuht' } });
    
    // Check that role changed
    expect(screen.getByLabelText(/roll/i)).toHaveValue('programmijuht');
  });
  
  test('handles group selection with checkboxes', () => {
    render(<Register />);
    
    // Initially no groups are selected
    const checkbox1 = screen.getByLabelText(/Group 1/);
    const checkbox2 = screen.getByLabelText(/Group 2/);
    
    expect(checkbox1).not.toBeChecked();
    expect(checkbox2).not.toBeChecked();
    
    // Select Group 1
    fireEvent.click(checkbox1);
    expect(checkbox1).toBeChecked();
    expect(checkbox2).not.toBeChecked();
    
    // Select Group 2 as well
    fireEvent.click(checkbox2);
    expect(checkbox1).toBeChecked();
    expect(checkbox2).toBeChecked();
    
    // Unselect Group 1
    fireEvent.click(checkbox1);
    expect(checkbox1).not.toBeChecked();
    expect(checkbox2).toBeChecked();
  });
  
  test('shows loading indicator when fetching groups', () => {
    // Mock loading state for groups
    const { useGetRegistrationGroupsQuery } = require('../../services/api');
    useGetRegistrationGroupsQuery.mockReturnValueOnce({
      data: undefined,
      isLoading: true
    });
    
    render(<Register />);
    
    // Check that loading message is displayed
    expect(screen.getByText(/laen gruppe/i)).toBeInTheDocument();
  });
  
  test('shows empty message when no groups are found', () => {
    // Mock empty groups
    const { useGetRegistrationGroupsQuery } = require('../../services/api');
    useGetRegistrationGroupsQuery.mockReturnValueOnce({
      data: [],
      isLoading: false
    });
    
    render(<Register />);
    
    // Check that empty message is displayed
    expect(screen.getByText(/gruppe ei leitud/i)).toBeInTheDocument();
  });
  
  test('submits form with all data and navigates to home after registration', async () => {
    // Get the mocked functions
    const { useRegisterMutation, useLoginMutation } = require('../../services/api');
    const [register] = useRegisterMutation();
    const [login] = useLoginMutation();
    
    render(<Register />);
    
    // Fill the form
    fireEvent.change(screen.getByLabelText(/nimi/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/parool/i), { target: { value: 'password123' } });
    
    // Select groups
    fireEvent.click(screen.getByLabelText(/Group 1/));
    
    // Submit the form by clicking the button
    fireEvent.click(screen.getByRole('button', { name: /registreeru/i }));
    
    // Check that register was called with the right data
    await waitFor(() => {
      expect(register).toHaveBeenCalled();
    });
    
    // After successful registration, login should be called
    await waitFor(() => {
      expect(login).toHaveBeenCalled();
    });
    
    // After login, it should fetch user data and navigate home
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
  
  test('displays error message when registration fails', async () => {
    // Get the mocked register function and override it for this test
    const { useRegisterMutation } = require('../../services/api');
    const [register] = useRegisterMutation();
    
    // Override the unwrap implementation for this test
    register.mockReturnValueOnce({
      unwrap: () => Promise.reject({ data: { error: 'Registration failed' } })
    });
    
    render(<Register />);
    
    // Fill the form
    fireEvent.change(screen.getByLabelText(/nimi/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'existing@example.com' } });
    fireEvent.change(screen.getByLabelText(/parool/i), { target: { value: 'password123' } });
    
    // Submit the form by clicking the button
    fireEvent.click(screen.getByRole('button', { name: /registreeru/i }));
    
    // Check that error message is displayed - use the exact error message from component
    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });
    
    // Verify that register was called but login was not
    expect(register).toHaveBeenCalled();
    
    // Get the mocked login function
    const { useLoginMutation } = require('../../services/api');
    const [login] = useLoginMutation();
    
    // Login should not be called
    expect(login).not.toHaveBeenCalled();
  });
}); 