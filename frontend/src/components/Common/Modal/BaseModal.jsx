import React from 'react';
import './styles/Modal.css';
import { stopPropagation } from './useModalUtils';

const BaseModal = ({ isOpen, typeClass, icon, title, onClose, children, actions }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-content ${typeClass}`} onClick={stopPropagation}>
        <div className="modal-header">
          <div className="modal-icon">{icon}</div>
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <div className="modal-body">
          {children}
        </div>
        <div className="modal-actions">
          {actions}
        </div>
      </div>
    </div>
  );
};

export default BaseModal;

