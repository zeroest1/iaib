import React from 'react';
import { render, screen } from '@testing-library/react';
import EmptyNotifications from '../../components/notifications/EmptyNotifications';
import { getEmptyNotificationMessage } from '../../components/notifications/utils';

// Mock the utils function
jest.mock('../../components/notifications/utils', () => ({
  getEmptyNotificationMessage: jest.fn()
}));

describe('EmptyNotifications Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default implementation returns a test message
    getEmptyNotificationMessage.mockImplementation(() => 'Test empty message');
  });
  
  test('renders empty notifications message', () => {
    render(<EmptyNotifications />);
    
    expect(screen.getByText('Test empty message')).toBeInTheDocument();
  });
  
  test('calls getEmptyNotificationMessage with correct props', () => {
    const props = {
      showFavoritesOnly: true,
      filter: 'all',
      isMyNotifications: false,
      pathname: '/favorites',
      hasSearch: false
    };
    
    render(<EmptyNotifications {...props} />);
    
    expect(getEmptyNotificationMessage).toHaveBeenCalledWith(
      props.showFavoritesOnly,
      props.filter,
      props.isMyNotifications,
      props.pathname,
      props.hasSearch
    );
  });
  
  test('displays message for favorites view', () => {
    getEmptyNotificationMessage.mockReturnValueOnce('Teil ei ole lemmikuid teateid.');
    
    render(
      <EmptyNotifications 
        showFavoritesOnly={true}
        pathname="/favorites"
      />
    );
    
    expect(screen.getByText('Teil ei ole lemmikuid teateid.')).toBeInTheDocument();
  });
  
  test('displays message for my notifications view', () => {
    getEmptyNotificationMessage.mockReturnValueOnce('Teil ei ole veel ühtegi teadet loodud.');
    
    render(
      <EmptyNotifications 
        isMyNotifications={true}
        pathname="/my-notifications"
      />
    );
    
    expect(screen.getByText('Teil ei ole veel ühtegi teadet loodud.')).toBeInTheDocument();
  });
  
  test('displays message for unread notifications view', () => {
    getEmptyNotificationMessage.mockReturnValueOnce('Teil ei ole lugemata teateid.');
    
    render(
      <EmptyNotifications 
        filter="unread"
      />
    );
    
    expect(screen.getByText('Teil ei ole lugemata teateid.')).toBeInTheDocument();
  });
  
  test('displays message for search with no results', () => {
    getEmptyNotificationMessage.mockReturnValueOnce('Otsingule vastavaid teateid ei leitud.');
    
    render(
      <EmptyNotifications 
        hasSearch={true}
      />
    );
    
    expect(screen.getByText('Otsingule vastavaid teateid ei leitud.')).toBeInTheDocument();
  });
  
  test('displays default message for empty list', () => {
    getEmptyNotificationMessage.mockReturnValueOnce('Teadete nimekiri on tühi.');
    
    render(<EmptyNotifications />);
    
    expect(screen.getByText('Teadete nimekiri on tühi.')).toBeInTheDocument();
  });
  
  test('has correct CSS class', () => {
    render(<EmptyNotifications />);
    
    const emptyNotificationsElement = screen.getByText('Test empty message').closest('div');
    expect(emptyNotificationsElement).toHaveClass('no-notifications');
  });
}); 