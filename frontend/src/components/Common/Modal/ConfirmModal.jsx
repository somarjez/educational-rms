import React from 'react';
import { getTypeClass, getIcon } from './useModalUtils';
import BaseModal from './BaseModal';
import './styles/Modal.css';

const ConfirmModal = ({ title, message, type = 'warning', isOpen, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', isDangerous = false }) => {
  const typeClass = getTypeClass(type);
  const icon = getIcon(type);
  const actions = (
    <>
      <button className="modal-btn-secondary" onClick={onCancel}>
        {cancelText}
      </button>
      <button
        className={isDangerous ? 'modal-btn-danger' : 'modal-btn-primary'}
        onClick={onConfirm}
      >
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
      onClose={onCancel}
      actions={actions}
    >
      <p>{message}</p>
    </BaseModal>
  );
};

export default ConfirmModal;

