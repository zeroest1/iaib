import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import RoleProtectedRoute from '../../components/auth/RoleProtectedRoute';

const mockStore = configureStore([]);

// Mock console.log to avoid console output in tests
global.console.log = jest.fn();

// Mock the Outlet component
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  Outlet: () => <div data-testid="protected-content">Protected Content</div>
}));

describe('RoleProtectedRoute Component', () => {
  beforeEach(() => {
    // Clear console mocks before each test
    jest.clearAllMocks();
  });
  
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
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            <Route path="/admin" element={<RoleProtectedRoute allowedRoles={['admin', 'programmijuht']} />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    // Should redirect to login
    expect(screen.getByTestId('login-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
  
  test('redirects to home when user has an unauthorized role', () => {
    // Create store with authenticated state but unauthorized role
    const store = mockStore({
      auth: {
        user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'tudeng' },
        isAuthenticated: true,
        loading: false
      }
    });
    
    // Set up test routes
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            <Route path="/admin" element={<RoleProtectedRoute allowedRoles={['admin', 'programmijuht']} />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    // Should redirect to home
    expect(screen.getByTestId('home-page')).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
  });
  
  test('allows access when user has an authorized role', () => {
    // Create store with authenticated state and authorized role
    const store = mockStore({
      auth: {
        user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'programmijuht' },
        isAuthenticated: true,
        loading: false
      }
    });
    
    // Set up test routes
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            <Route path="/admin" element={<RoleProtectedRoute allowedRoles={['admin', 'programmijuht']} />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    // Should render protected content
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
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
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/" element={<div data-testid="home-page">Home Page</div>} />
            <Route path="/login" element={<div data-testid="login-page">Login Page</div>} />
            <Route path="/admin" element={<RoleProtectedRoute allowedRoles={['admin', 'programmijuht']} />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    // Should show loading message
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('home-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument();
  });
  
  test('logs debugging information', () => {
    // Create store with authenticated state and authorized role
    const store = mockStore({
      auth: {
        user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'programmijuht' },
        isAuthenticated: true,
        loading: false
      }
    });
    
    // Set up test routes
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/admin']}>
          <Routes>
            <Route path="/admin" element={<RoleProtectedRoute allowedRoles={['admin', 'programmijuht']} />} />
          </Routes>
        </MemoryRouter>
      </Provider>
    );
    
    // Verify that console.log was called with debugging information
    expect(console.log).toHaveBeenCalled();
    expect(console.log).toHaveBeenCalledWith('RoleProtectedRoute state:', expect.any(Object));
    expect(console.log).toHaveBeenCalledWith('Token exists:', expect.any(Boolean));
    expect(console.log).toHaveBeenCalledWith('RoleProtectedRoute: Access granted to user:', expect.any(Object));
  });
}); 