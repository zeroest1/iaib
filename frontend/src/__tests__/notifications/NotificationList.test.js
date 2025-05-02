import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import configureStore from 'redux-mock-store';
import NotificationList from '../../components/notifications/NotificationList';
import userEvent from '@testing-library/user-event';

// Mock child components
jest.mock('../../components/notifications/NotificationItem', () => {
  return function MockNotificationItem({ notification, onDelete, onToggleFavorite, onMarkAsRead, isFavorite, isRead }) {
    return (
      <div data-testid={`notification-item-${notification.id}`} className={`notification-item ${isRead ? 'read' : 'unread'}`}>
        <h3>{notification.title}</h3>
        <p>{notification.content}</p>
        <button onClick={() => onDelete(notification.id)}>Delete</button>
        <button onClick={() => onToggleFavorite(notification.id)}>
          {isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        </button>
        {!isRead && <button onClick={() => onMarkAsRead(notification.id)}>Mark as read</button>}
      </div>
    );
  };
});

jest.mock('../../components/notifications/NotificationFilters', () => {
  return function MockNotificationFilters({ onSearch, onPriorityChange, onCategoryChange }) {
    return (
      <div data-testid="notification-filters">
        <input 
          data-testid="search-input" 
          placeholder="Search" 
          onChange={(e) => onSearch(e.target.value)}
        />
        <select 
          data-testid="priority-filter"
          multiple
          onChange={(e) => {
            const selected = Array.from(e.target.selectedOptions).map(option => option.value);
            onPriorityChange(selected);
          }}
        >
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
      </div>
    );
  };
});

// Mock RTK Query hooks
jest.mock('../../services/api', () => ({
  useGetNotificationsQuery: jest.fn(() => ({
    data: {
      notifications: [
        { id: 1, title: 'Test Notification 1', content: 'Content 1', priority: 'high', category: 'general' },
        { id: 2, title: 'Test Notification 2', content: 'Content 2', priority: 'medium', category: 'exam' },
        { id: 3, title: 'Test Notification 3', content: 'Content 3', priority: 'low', category: 'homework' }
      ],
      pagination: { total: 3, page: 1, limit: 10, totalPages: 1 }
    },
    isLoading: false
  })),
  useSearchNotificationsQuery: jest.fn(() => ({
    data: {
      notifications: [{ id: 2, title: 'Test Notification 2', content: 'Content 2', priority: 'medium', category: 'exam' }],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
    },
    isLoading: false
  })),
  useGetFavoritesQuery: jest.fn(() => ({
    data: [{ notification_id: 1 }], // Notification 1 is favorited
    isLoading: false
  })),
  useGetReadStatusQuery: jest.fn(() => ({
    data: [{ notification_id: 2 }], // Notification 2 is read
    isSuccess: true,
    isLoading: false
  })),
  useDeleteNotificationMutation: jest.fn(() => [
    jest.fn().mockResolvedValue({}),
    { isLoading: false }
  ]),
  useAddFavoriteMutation: jest.fn(() => [
    jest.fn().mockResolvedValue({}),
    { isLoading: false }
  ]),
  useRemoveFavoriteMutation: jest.fn(() => [
    jest.fn().mockResolvedValue({}),
    { isLoading: false }
  ]),
  useMarkAsReadMutation: jest.fn(() => [
    jest.fn().mockResolvedValue({}),
    { isLoading: false }
  ])
}));

const mockStore = configureStore([]);
const store = mockStore({
  auth: {
    user: { id: 1, name: 'Test User', email: 'test@example.com', role: 'tudeng' },
    isAuthenticated: true
  }
});

describe('NotificationList Component', () => {
  beforeEach(() => {
    // Reset mocks between tests
    jest.clearAllMocks();
  });
  
  test('renders notification list with items', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <NotificationList />
        </BrowserRouter>
      </Provider>
    );
    
    // Should render notification items
    expect(screen.getByTestId('notification-item-1')).toBeInTheDocument();
    expect(screen.getByTestId('notification-item-2')).toBeInTheDocument();
    expect(screen.getByTestId('notification-item-3')).toBeInTheDocument();
    
    // Should render filters
    expect(screen.getByTestId('notification-filters')).toBeInTheDocument();
  });
  
  test('marks items as read/unread correctly', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <NotificationList />
        </BrowserRouter>
      </Provider>
    );
    
    // Notification 2 should be marked as read
    const notification2 = screen.getByTestId('notification-item-2');
    expect(notification2).toHaveClass('read');
    
    // Notifications 1 and 3 should be unread
    const notification1 = screen.getByTestId('notification-item-1');
    const notification3 = screen.getByTestId('notification-item-3');
    expect(notification1).toHaveClass('unread');
    expect(notification3).toHaveClass('unread');
  });
  
  test('marks items as favorite correctly', () => {
    render(
      <Provider store={store}>
        <BrowserRouter>
          <NotificationList />
        </BrowserRouter>
      </Provider>
    );
    
    // Notification 1 should be marked as favorite
    expect(screen.getByText('Remove from favorites')).toBeInTheDocument();
    
    // Notifications 2 and 3 should not be favorites
    const addToFavoriteButtons = screen.getAllByText('Add to favorites');
    expect(addToFavoriteButtons).toHaveLength(2);
  });
  
  test('handles search correctly', async () => {
    const { useSearchNotificationsQuery } = require('../../services/api');
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <NotificationList />
        </BrowserRouter>
      </Provider>
    );
    
    // Find and fill the search input
    const searchInput = screen.getByTestId('search-input');
    await userEvent.type(searchInput, 'Notification 2');
    
    // Wait for the debounce to complete
    await waitFor(() => {
      expect(useSearchNotificationsQuery).toHaveBeenCalledWith(
        expect.objectContaining({ query: 'Notification 2' }),
        expect.anything()
      );
    });
  });
  
  test('handles notification deletion', async () => {
    const { useDeleteNotificationMutation } = require('../../services/api');
    const deleteNotification = useDeleteNotificationMutation()[0];
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <NotificationList />
        </BrowserRouter>
      </Provider>
    );
    
    // Click delete button on the first notification
    fireEvent.click(screen.getAllByText('Delete')[0]);
    
    // Modal should be shown asking for confirmation
    expect(screen.getByText(/soovid selle teate kustutada/i)).toBeInTheDocument();
    
    // Confirm deletion
    fireEvent.click(screen.getByText('Jah'));
    
    // Check if delete function was called with correct ID
    await waitFor(() => {
      expect(deleteNotification).toHaveBeenCalledWith(1);
    });
  });
  
  test('handles toggling favorites', async () => {
    const { useAddFavoriteMutation, useRemoveFavoriteMutation } = require('../../services/api');
    const addFavorite = useAddFavoriteMutation()[0];
    const removeFavorite = useRemoveFavoriteMutation()[0];
    
    const onFavoritesChangeMock = jest.fn();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <NotificationList onFavoritesChange={onFavoritesChangeMock} />
        </BrowserRouter>
      </Provider>
    );
    
    // Remove notification 1 from favorites
    fireEvent.click(screen.getByText('Remove from favorites'));
    
    await waitFor(() => {
      expect(removeFavorite).toHaveBeenCalledWith(1);
      expect(onFavoritesChangeMock).toHaveBeenCalled();
    });
    
    // Add notification 2 to favorites
    fireEvent.click(screen.getAllByText('Add to favorites')[0]);
    
    await waitFor(() => {
      expect(addFavorite).toHaveBeenCalledWith(2);
      expect(onFavoritesChangeMock).toHaveBeenCalledTimes(2);
    });
  });
  
  test('handles marking notifications as read', async () => {
    const { useMarkAsReadMutation } = require('../../services/api');
    const markAsRead = useMarkAsReadMutation()[0];
    
    const onUnreadChangeMock = jest.fn();
    
    render(
      <Provider store={store}>
        <BrowserRouter>
          <NotificationList onUnreadChange={onUnreadChangeMock} />
        </BrowserRouter>
      </Provider>
    );
    
    // Mark notification 3 as read
    fireEvent.click(screen.getAllByText('Mark as read')[1]); // Second unread notification (ID: 3)
    
    await waitFor(() => {
      expect(markAsRead).toHaveBeenCalledWith(3);
      expect(onUnreadChangeMock).toHaveBeenCalled();
    });
  });
  
  test('renders different view when on favorites page', () => {
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/favorites']}>
          <NotificationList />
        </MemoryRouter>
      </Provider>
    );
    
    // On favorites page the component will use showFavoritesOnly=true
    // which affects pagination strategy and title
    expect(screen.getByText(/test notification 1/i)).toBeInTheDocument();
    expect(screen.queryByText(/test notification 2/i)).toBeInTheDocument();
    expect(screen.queryByText(/test notification 3/i)).toBeInTheDocument();
  });
  
  test('renders different view when on my-notifications page', () => {
    // Override the mock for this specific test
    const { useGetNotificationsQuery } = require('../../services/api');
    useGetNotificationsQuery.mockReturnValueOnce({
      data: {
        notifications: [
          { id: 4, title: 'My Notification', content: 'My Content', priority: 'high', category: 'general' }
        ],
        pagination: { total: 1, page: 1, limit: 10, totalPages: 1 }
      },
      isLoading: false
    });
    
    render(
      <Provider store={store}>
        <MemoryRouter initialEntries={['/my-notifications']}>
          <NotificationList />
        </MemoryRouter>
      </Provider>
    );
    
    // On my-notifications page the component will use my=true in the API call
    expect(useGetNotificationsQuery).toHaveBeenCalledWith(
      expect.objectContaining({ my: true }),
      expect.anything()
    );
    
    expect(screen.getByText(/my notification/i)).toBeInTheDocument();
  });
}); 