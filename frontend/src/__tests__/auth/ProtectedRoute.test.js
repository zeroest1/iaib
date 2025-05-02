import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import ProtectedRoute from '../../components/auth/ProtectedRoute';

const mockStore = configureStore([]);

// Mock the Outlet component
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div data-testid="protected-content">Protected Content</div>
}));

describe('ProtectedRoute Component', () => {
  test('redirects to login when user is not authenticated', () => {
    // Create store with unauthenticated state
    const store = mockStore({
      auth: {
        user: null,
        isAuthenticated: false,
        loading: false
      }
    });
    
    // Set up test routes
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            <Route path="/protected" element={<ProtectedRoute />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    // Should redirect to login
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
  
  test('allows access when user is authenticated', () => {
    // Create store with authenticated state
    const store = mockStore({
      auth: {
        user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'user' },
        isAuthenticated: true,
        loading: false
      }
    });
    
    // Set up test routes
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            <Route path="/protected" element={<ProtectedRoute />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    // Should render protected content
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });
  
  test('shows loading state when authentication is being determined', () => {
    // Create store with loading state
    const store = mockStore({
      auth: {
        user: null,
        isAuthenticated: false,
        loading: true
      }
    });
    
    // Set up test routes
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/protected']}>
          <Routes>
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            <Route path="/protected" element={<ProtectedRoute />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    // Should show loading message
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });
}); 