import React from 'react';
import './styles/ConfirmationModal.css';

/**
 * A reusable confirmation modal component
 * @param {Object} props Component props
 * @param {boolean} props.open Whether the modal is open
 * @param {string} props.title Modal title text
 * @param {string} props.message Modal message text
 * @param {string} props.confirmText Text for confirm button
 * @param {string} props.cancelText Text for cancel button
 * @param {Function} props.onConfirm Function to call when confirm is clicked
 * @param {Function} props.onCancel Function to call when cancel is clicked
 * @param {React.ReactNode} props.children Optional custom content to render inside the modal
 */
const ConfirmationModal = ({ 
  open, 
  title = 'Kinnita', 
  message, 
  confirmText = 'Kinnita', 
  cancelText = 'Tühista',
  onConfirm, 
  onCancel,
  children
}) => {
  if (!open) return null;
  
  return (
    <div className="custom-modal-overlay">
      <div className="custom-modal">
        {title && <h3>{title}</h3>}
        {message && <p>{message}</p>}
        
        {children}
        
        <div className="custom-modal-actions">
          <button className="custom-modal-cancel" onClick={onCancel}>
            {cancelText}
          </button>
          <button className="custom-modal-confirm" onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal; 