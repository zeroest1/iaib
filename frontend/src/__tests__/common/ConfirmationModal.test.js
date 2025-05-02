import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmationModal from '../../components/common/ConfirmationModal';

describe('ConfirmationModal Component', () => {
  test('renders nothing when not open', () => {
    render(
      <ConfirmationModal 
        open={false}
        message="Test message"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    
    // Should not render anything
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
    expect(screen.queryByText('Kinnita')).not.toBeInTheDocument();
    expect(screen.queryByText('Tühista')).not.toBeInTheDocument();
  });
  
  test('renders with default props when open', () => {
    render(
      <ConfirmationModal 
        open={true}
        message="Test message"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    
    // Should render message and default buttons
    expect(screen.getByText('Test message')).toBeInTheDocument();
    
    // Check for title
    const titleElement = screen.getByRole('heading');
    expect(titleElement).toHaveTextContent('Kinnita');
    
    // Check for confirm button using role to avoid duplicates
    const confirmButton = screen.getByRole('button', { name: 'Kinnita' });
    expect(confirmButton).toBeInTheDocument();
    
    expect(screen.getByText('Tühista')).toBeInTheDocument(); // Default cancel text
  });
  
  test('renders with custom props', () => {
    render(
      <ConfirmationModal 
        open={true}
        title="Custom Title"
        message="Test message"
        confirmText="Yes"
        cancelText="No"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    
    // Should render with custom text
    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });
  
  test('renders delete confirmation styling', () => {
    render(
      <ConfirmationModal 
        open={true}
        message="Do you want to delete this item?"
        isDelete={true}
        confirmText="Delete"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    );
    
    // Confirm button should have delete-confirm class
    const confirmButton = screen.getByText('Delete');
    expect(confirmButton).toHaveClass('delete-confirm');
  });
  
  test('calls onConfirm when confirm button is clicked', () => {
    const mockConfirm = jest.fn();
    
    render(
      <ConfirmationModal 
        open={true}
        message="Test message"
        onConfirm={mockConfirm}
        onCancel={() => {}}
      />
    );
    
    // Click confirm button - using role to avoid duplicates
    fireEvent.click(screen.getByRole('button', { name: 'Kinnita' }));
    
    // onConfirm should be called
    expect(mockConfirm).toHaveBeenCalledTimes(1);
  });
  
  test('calls onCancel when cancel button is clicked', () => {
    const mockCancel = jest.fn();
    
    render(
      <ConfirmationModal 
        open={true}
        message="Test message"
        onConfirm={() => {}}
        onCancel={mockCancel}
      />
    );
    
    // Click cancel button
    fireEvent.click(screen.getByText('Tühista'));
    
    // onCancel should be called
    expect(mockCancel).toHaveBeenCalledTimes(1);
  });
  
  test('renders custom children content', () => {
    render(
      <ConfirmationModal 
        open={true}
        onConfirm={() => {}}
        onCancel={() => {}}
      >
        <div data-testid="custom-content">
          <p>Custom content</p>
          <input type="text" placeholder="Custom input" />
        </div>
      </ConfirmationModal>
    );
    
    // Should render custom content
    expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    expect(screen.getByText('Custom content')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Custom input')).toBeInTheDocument();
  });
}); 