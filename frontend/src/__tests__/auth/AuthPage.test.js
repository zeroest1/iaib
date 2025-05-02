import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AuthPage from '../../components/auth/AuthPage';

// Mock the child components
jest.mock('../../components/auth/Login', () => {
  return function MockLogin() {
    return <div data-testid="login-component">Login Component</div>;
  };
});

jest.mock('../../components/auth/Register', () => {
  return function MockRegister() {
    return <div data-testid="register-component">Register Component</div>;
  };
});

describe('AuthPage Component', () => {
  test('renders login form by default', () => {
    render(
      <BrowserRouter>
        <AuthPage />
      </BrowserRouter>
    );
    
    // Check tabs exist
    expect(screen.getByText(/logi sisse/i)).toBeInTheDocument();
    expect(screen.getByText(/registreeru/i)).toBeInTheDocument();
    
    // Login should be active by default
    const loginTab = screen.getByText(/logi sisse/i).closest('button');
    expect(loginTab).toHaveClass('active');
    
    // Login component should be visible
    expect(screen.getByTestId('login-component')).toBeInTheDocument();
    
    // Register component should not be visible
    expect(screen.queryByTestId('register-component')).not.toBeInTheDocument();
  });
  
  test('switches to register tab when clicked', () => {
    render(
      <BrowserRouter>
        <AuthPage />
      </BrowserRouter>
    );
    
    // Initially login tab is active
    expect(screen.getByTestId('login-component')).toBeInTheDocument();
    
    // Click register tab
    fireEvent.click(screen.getByText(/registreeru/i));
    
    // Now register tab should be active
    const registerTab = screen.getByText(/registreeru/i).closest('button');
    expect(registerTab).toHaveClass('active');
    
    // Register component should be visible
    expect(screen.getByTestId('register-component')).toBeInTheDocument();
    
    // Login component should not be visible
    expect(screen.queryByTestId('login-component')).not.toBeInTheDocument();
  });
  
  test('switches back to login tab when clicked', () => {
    render(
      <BrowserRouter>
        <AuthPage />
      </BrowserRouter>
    );
    
    // Switch to register tab first
    fireEvent.click(screen.getByText(/registreeru/i));
    expect(screen.getByTestId('register-component')).toBeInTheDocument();
    
    // Click login tab
    fireEvent.click(screen.getByText(/logi sisse/i));
    
    // Now login tab should be active
    const loginTab = screen.getByText(/logi sisse/i).closest('button');
    expect(loginTab).toHaveClass('active');
    
    // Login component should be visible
    expect(screen.getByTestId('login-component')).toBeInTheDocument();
    
    // Register component should not be visible
    expect(screen.queryByTestId('register-component')).not.toBeInTheDocument();
  });
}); 