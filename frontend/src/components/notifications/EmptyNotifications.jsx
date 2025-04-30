import React from 'react';
import { getEmptyNotificationMessage } from './utils';

const EmptyNotifications = ({ showFavoritesOnly, filter, isMyNotifications, pathname, hasSearch }) => {
  const message = getEmptyNotificationMessage(showFavoritesOnly, filter, isMyNotifications, pathname, hasSearch);
  
  return (
    <div className="no-notifications">
      <p>{message}</p>
    </div>
  );
};

export default EmptyNotifications; 