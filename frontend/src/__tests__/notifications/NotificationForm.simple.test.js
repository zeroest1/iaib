/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen } from '@testing-library/react';

// A simple component to test
const SimpleNotificationForm = ({ isTemplate = false, isEdit = false }) => (
  <div>
    <h2>
      {isTemplate 
        ? (isEdit ? 'Muuda malli' : 'Lisa uus mall') 
        : 'Lisa uus teade'}
    </h2>
  </div>
);

describe('Simple NotificationForm Test', () => {
  test('renders with correct title for new notification', () => {
    render(<SimpleNotificationForm />);
    expect(screen.getByText('Lisa uus teade')).toBeInTheDocument();
  });

  test('renders with correct title for new template', () => {
    render(<SimpleNotificationForm isTemplate={true} />);
    expect(screen.getByText('Lisa uus mall')).toBeInTheDocument();
  });
}); 