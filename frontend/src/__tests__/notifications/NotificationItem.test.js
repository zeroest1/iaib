/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';

// Mock react-router-dom
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useLocation: () => ({
    pathname: '/notifications',
    search: ''
  })
}));

// Mock react-icons
jest.mock('react-icons/md', () => ({
  MdDelete: () => <span data-testid="delete-icon">DeleteIcon</span>,
  MdEdit: () => <span data-testid="edit-icon">EditIcon</span>
}));

// Import the component after mocking dependencies
import NotificationItem from '../../components/notifications/NotificationItem';

describe('NotificationItem Component', () => {
  const mockNotification = {
    id: 1,
    title: 'Test Title',
    content: 'Test Content',
    created_at: '2023-01-01T10:00:00Z',
    category: 'õppetöö',
    priority: 'tavaline',
    creator_name: 'testuser',
    excerpt: null
  };

  const renderWithRouter = (ui, { route = '/' } = {}) => {
    window.history.pushState({}, 'Test page', route);
    return render(ui, { wrapper: BrowserRouter });
  };

  test('renders notification item with correct content', () => {
    renderWithRouter(
      <NotificationItem 
        notification={mockNotification} 
        onMarkAsRead={jest.fn()}
        onToggleFavorite={jest.fn()}
        readStatus={{}}
        isFavorite={false}
      />
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('õppetöö')).toBeInTheDocument();
    expect(screen.getByText('Autor: testuser')).toBeInTheDocument();
  });

  test('truncates long content with ellipsis', () => {
    const longContent = 'A'.repeat(150);
    const longNotification = { ...mockNotification, content: longContent };

    renderWithRouter(
      <NotificationItem 
        notification={longNotification} 
        onMarkAsRead={jest.fn()}
        onToggleFavorite={jest.fn()}
        readStatus={{}}
        isFavorite={false}
      />
    );
    
    const expectedTruncatedText = longContent.substring(0, 100) + '...';
    expect(screen.getByText(expectedTruncatedText)).toBeInTheDocument();
  });

  test('displays unread style when notification is unread', () => {
    const { container } = renderWithRouter(
      <NotificationItem 
        notification={mockNotification} 
        onMarkAsRead={jest.fn()}
        onToggleFavorite={jest.fn()}
        readStatus={{}}
        isFavorite={false}
      />
    );
    
    const notificationItem = container.querySelector('.notification-item');
    expect(notificationItem).toHaveClass('unread');
  });

  test('displays read style when notification is read', () => {
    const { container } = renderWithRouter(
      <NotificationItem 
        notification={mockNotification} 
        onMarkAsRead={jest.fn()}
        onToggleFavorite={jest.fn()}
        readStatus={{ 1: true }}
        isFavorite={false}
      />
    );
    
    const notificationItem = container.querySelector('.notification-item');
    expect(notificationItem).toHaveClass('read');
    expect(notificationItem).not.toHaveClass('unread');
  });

  test('calls onMarkAsRead when notification is clicked', () => {
    const mockOnMarkAsRead = jest.fn();
    
    renderWithRouter(
      <NotificationItem 
        notification={mockNotification} 
        onMarkAsRead={mockOnMarkAsRead}
        onToggleFavorite={jest.fn()}
        readStatus={{}}
        isFavorite={false}
      />
    );
    
    const notificationLink = screen.getByRole('link');
    fireEvent.click(notificationLink);
    
    expect(mockOnMarkAsRead).toHaveBeenCalledWith(mockNotification.id);
  });

  test('calls onToggleFavorite when favorite button is clicked', () => {
    const mockOnToggleFavorite = jest.fn();
    
    renderWithRouter(
      <NotificationItem 
        notification={mockNotification} 
        onMarkAsRead={jest.fn()}
        onToggleFavorite={mockOnToggleFavorite}
        readStatus={{}}
        isFavorite={false}
      />
    );
    
    const favoriteButton = screen.getByTitle('Lisa lemmikutesse');
    fireEvent.click(favoriteButton);
    
    expect(mockOnToggleFavorite).toHaveBeenCalledWith(mockNotification.id);
  });

  test('renders excerpt when provided', () => {
    const notificationWithExcerpt = { 
      ...mockNotification, 
      excerpt: 'This is a custom excerpt'
    };
    
    renderWithRouter(
      <NotificationItem 
        notification={notificationWithExcerpt} 
        onMarkAsRead={jest.fn()}
        onToggleFavorite={jest.fn()}
        readStatus={{}}
        isFavorite={false}
      />
    );
    
    expect(screen.getByText('This is a custom excerpt')).toBeInTheDocument();
    // Both excerpt and content can be displayed in the component
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  test('displays favorite icon correctly for favorited notification', () => {
    renderWithRouter(
      <NotificationItem 
        notification={mockNotification} 
        onMarkAsRead={jest.fn()}
        onToggleFavorite={jest.fn()}
        readStatus={{}}
        isFavorite={true}
      />
    );
    
    // Check for active class on the button
    const favoriteButton = screen.getByTitle('Eemalda lemmikutest');
    expect(favoriteButton).toHaveClass('active');
    
    // Check for filled star
    expect(screen.getByText('★')).toBeInTheDocument();
  });

  test('displays proper priority as data attribute', () => {
    const highPriorityNotification = { 
      ...mockNotification, 
      priority: 'kõrge'
    };
    
    const { container } = renderWithRouter(
      <NotificationItem 
        notification={highPriorityNotification} 
        onMarkAsRead={jest.fn()}
        onToggleFavorite={jest.fn()}
        readStatus={{}}
        isFavorite={false}
      />
    );
    
    const notificationItem = container.querySelector('.notification-item');
    expect(notificationItem).toHaveAttribute('data-priority', 'kõrge');
  });

  test('displays category label correctly', () => {
    renderWithRouter(
      <NotificationItem 
        notification={mockNotification} 
        onMarkAsRead={jest.fn()}
        onToggleFavorite={jest.fn()}
        readStatus={{}}
        isFavorite={false}
      />
    );
    
    expect(screen.getByText('õppetöö')).toBeInTheDocument();
  });

  test('shows author username in creator field', () => {
    renderWithRouter(
      <NotificationItem 
        notification={mockNotification} 
        onMarkAsRead={jest.fn()}
        onToggleFavorite={jest.fn()}
        readStatus={{}}
        isFavorite={false}
      />
    );
    
    expect(screen.getByText('Autor: testuser')).toBeInTheDocument();
  });

  test('handles notification with missing creator name', () => {
    const notificationWithoutAuthor = { 
      ...mockNotification, 
      creator_name: null
    };
    
    renderWithRouter(
      <NotificationItem 
        notification={notificationWithoutAuthor} 
        onMarkAsRead={jest.fn()}
        onToggleFavorite={jest.fn()}
        readStatus={{}}
        isFavorite={false}
      />
    );
    
    expect(screen.getByText('Autor:')).toBeInTheDocument();
  });

  test('renders correctly with minimal props', () => {
    const minimalNotification = {
      id: 1,
      title: 'Minimal Title',
      content: 'Minimal Content',
      category: '',
      priority: ''
    };
    
    renderWithRouter(
      <NotificationItem 
        notification={minimalNotification} 
        onMarkAsRead={jest.fn()}
        onToggleFavorite={jest.fn()}
        readStatus={{}}
        isFavorite={false}
      />
    );
    
    expect(screen.getByText('Minimal Title')).toBeInTheDocument();
    expect(screen.getByText('Minimal Content')).toBeInTheDocument();
  });

  test('links to the correct detail page', () => {
    renderWithRouter(
      <NotificationItem 
        notification={mockNotification} 
        onMarkAsRead={jest.fn()}
        onToggleFavorite={jest.fn()}
        readStatus={{}}
        isFavorite={false}
      />
    );
    
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', `/notifications/${mockNotification.id}`);
  });

  test('shows admin actions when onDelete is provided', () => {
    renderWithRouter(
      <NotificationItem 
        notification={mockNotification} 
        onMarkAsRead={jest.fn()}
        onToggleFavorite={jest.fn()}
        readStatus={{}}
        isFavorite={false}
        onDelete={jest.fn()}
      />
    );
    
    expect(screen.getByTestId('edit-icon')).toBeInTheDocument();
    expect(screen.getByTestId('delete-icon')).toBeInTheDocument();
    expect(screen.getByText('Muuda')).toBeInTheDocument();
    expect(screen.getByText('Kustuta')).toBeInTheDocument();
  });

  test('does not show admin actions when onDelete is not provided', () => {
    renderWithRouter(
      <NotificationItem 
        notification={mockNotification} 
        onMarkAsRead={jest.fn()}
        onToggleFavorite={jest.fn()}
        readStatus={{}}
        isFavorite={false}
      />
    );
    
    expect(screen.queryByTestId('edit-icon')).not.toBeInTheDocument();
    expect(screen.queryByTestId('delete-icon')).not.toBeInTheDocument();
  });

  test('calls onDelete when delete button is clicked', () => {
    const mockOnDelete = jest.fn();
    renderWithRouter(
      <NotificationItem 
        notification={mockNotification} 
        onMarkAsRead={jest.fn()}
        onToggleFavorite={jest.fn()}
        readStatus={{}}
        isFavorite={false}
        onDelete={mockOnDelete}
      />
    );
    
    const deleteButton = screen.getByTitle('Kustuta teade');
    fireEvent.click(deleteButton);
    
    expect(mockOnDelete).toHaveBeenCalledWith(mockNotification.id);
  });
}); 