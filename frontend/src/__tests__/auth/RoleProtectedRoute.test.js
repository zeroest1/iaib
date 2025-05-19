import React from 'react';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import RoleProtectedRoute from '../../components/auth/RoleProtectedRoute';

const mockStore = configureStore([]);

// Mock console.log to avoid console output in tests
global.console.log = jest.fn();

// Mock react-router-dom
jest.mock('react-router-dom', () => {
  return {
    Routes: ({ children }) => <div>{children}</div>,
    Route: ({ element }) => element,
    MemoryRouter: ({ children }) => <div>{children}</div>,
    Navigate: ({ to }) => <div data-testid={`navigate-${to.replace('/', '')}`}>Navigate to {to}</div>,
    Outlet: () => <div data-testid="protected-content">Protected Content</div>
  };
});

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
    
    render(
      <Provider store={store}>
        <RoleProtectedRoute allowedRoles={['admin', 'programmijuht']} />
      </Provider>
    );
    
    // Should redirect to login
    expect(screen.getByTestId('navigate-login')).toBeInTheDocument();
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
    
    render(
      <Provider store={store}>
        <RoleProtectedRoute allowedRoles={['admin', 'programmijuht']} />
      </Provider>
    );
    
    // Should redirect to home
    expect(screen.getByTestId('navigate-')).toBeInTheDocument();
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
    
    render(
      <Provider store={store}>
        <RoleProtectedRoute allowedRoles={['admin', 'programmijuht']} />
      </Provider>
    );
    
    // Should render protected content
    expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    expect(screen.queryByTestId('navigate-')).not.toBeInTheDocument();
    expect(screen.queryByTestId('navigate-login')).not.toBeInTheDocument();
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
    
    render(
      <Provider store={store}>
        <RoleProtectedRoute allowedRoles={['admin', 'programmijuht']} />
      </Provider>
    );
    
    // Should show loading message
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    expect(screen.queryByTestId('navigate-')).not.toBeInTheDocument();
    expect(screen.queryByTestId('navigate-login')).not.toBeInTheDocument();
  });
}); 