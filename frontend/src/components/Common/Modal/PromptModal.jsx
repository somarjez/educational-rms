import React, { useState } from 'react';
import { getTypeClass, getIcon } from './useModalUtils';
import BaseModal from './BaseModal';
import './styles/Modal.css';

const PromptModal = ({ title, label, placeholder, type = 'info', isOpen, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Cancel', required = false }) => {
  const [input, setInput] = useState('');

  const handleConfirm = () => {
    if (required && !input.trim()) {
      return;
    }
    onConfirm(input);
    setInput('');
  };

  const handleCancel = () => {
    setInput('');
    onCancel();
  };

  const typeClass = getTypeClass(type);
  const icon = getIcon(type);
  const actions = (
    <>
      <button className="modal-btn-secondary" onClick={handleCancel}>
        {cancelText}
      </button>
      <button className="modal-btn-primary" onClick={handleConfirm} disabled={required && !input.trim()}>
        {confirmText}
      </button>
    </>
  );
  return (
    <BaseModal
      isOpen={isOpen}
      typeClass={typeClass}
      icon={icon}
      title={title}
      onClose={handleCancel}
      actions={actions}
    >
      <label className="modal-label">{label}</label>
      <textarea
        className="modal-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        rows="4"
      />
      {required && !input.trim() && (
        <p className="modal-error-text">This field is required</p>
      )}
    </BaseModal>
  );
};

export default PromptModal;

