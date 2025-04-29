import React from 'react';
import './styles/NotificationList.css';

const ConfirmationModal = ({ open, message, onConfirm, onCancel }) => {
  if (!open) return null;
  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal">
        <p>{message}</p>
        <div className="custom-modal-actions">
          <button className="custom-modal-confirm" onClick={onConfirm}>Kinnita</button>
          <button className="custom-modal-cancel" onClick={onCancel}>Tühista</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 