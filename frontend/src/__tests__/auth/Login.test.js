import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Login from '../../components/auth/Login';

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

describe('Login Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });
  
  test('renders login form correctly', () => {
    render(<Login />);
    
    // Check for form elements
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/parool/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /logi sisse/i })).toBeInTheDocument();
  });
  
  test('handles input changes', () => {
    render(<Login />);
    
    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/parool/i);
    
    // Simulate user typing
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    
    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });
  
  test('submits form with valid credentials and navigates to home', async () => {
    // Get the mocked login function
    const { useLoginMutation } = require('../../services/api');
    const [login] = useLoginMutation();

    render(<Login />);
    
    // Fill the form
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/parool/i), { target: { value: 'password123' } });
    
    // Submit the form by clicking the button
    fireEvent.click(screen.getByRole('button', { name: /logi sisse/i }));
    
    // Wait for navigation to be called
    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
  
  test('shows error message when login fails', async () => {
    // Get the mocked login function and override it for this test
    const { useLoginMutation } = require('../../services/api');
    const [login] = useLoginMutation();
    
    // Override the unwrap implementation for this test
    login.mockReturnValueOnce({
      unwrap: () => Promise.reject({ data: { error: 'Login failed' } })
    });
    
    render(<Login />);
    
    // Fill the form with invalid credentials
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/parool/i), { target: { value: 'wrongpassword' } });
    
    // Submit the form by clicking the button
    fireEvent.click(screen.getByRole('button', { name: /logi sisse/i }));
    
    // Check for error message - use the actual message that appears in the component
    await waitFor(() => {
      expect(screen.getByText(/login failed/i)).toBeInTheDocument();
    });
    
    // Verify navigate was not called
    expect(mockNavigate).not.toHaveBeenCalled();
  });
  
  test('disables button during login process', () => {
    // Override the isLoading value for this test
    const { useLoginMutation } = require('../../services/api');
    useLoginMutation.mockReturnValueOnce([
      jest.fn(),
      { isLoading: true }
    ]);
    
    render(<Login />);
    
    // The button should be disabled and show loading text
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(button).toHaveTextContent(/sisselogimine\.\.\./i);
  });
}); 