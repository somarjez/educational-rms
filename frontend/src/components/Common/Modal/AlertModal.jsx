import React from 'react';
import { getTypeClass, getIcon } from './useModalUtils';
import BaseModal from './BaseModal';
import './styles/Modal.css';

const AlertModal = ({ title, message, type = 'info', onClose, isOpen }) => {
  const typeClass = getTypeClass(type);
  const icon = getIcon(type);
  const actions = (
    <button className="modal-btn-primary" onClick={onClose}>
      OK
    </button>
  );
  return (
    <BaseModal
      isOpen={isOpen}
      typeClass={typeClass}
      icon={icon}
      title={title}
      onClose={onClose}
      actions={actions}
    >
      <p>{message}</p>
    </BaseModal>
  );
};

export default AlertModal;

