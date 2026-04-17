import React from 'react';
import { FiSettings } from 'react-icons/fi';

const buttonStyle = { background: '#33489f', color: '#ffffff' };
const iconStyle = { background: 'rgba(255, 255, 255, 0.16)' };
const titleStyle = { color: '#ffffff' };
const descriptionStyle = { color: '#f2a33a' };

const AdminSchedulingActionClean = ({ onClick }) => (
  <button className="action-btn admin-action" onClick={onClick} type="button" style={buttonStyle}>
    <div className="action-icon" style={iconStyle}>
      <FiSettings />
    </div>
    <div className="action-text">
      <div className="action-title" style={titleStyle}>Admin Scheduling</div>
      <div className="action-description" style={descriptionStyle}>Manage resources and bookings</div>
    </div>
  </button>
);

export default AdminSchedulingActionClean;
