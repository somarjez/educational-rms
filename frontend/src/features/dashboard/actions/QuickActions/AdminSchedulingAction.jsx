import React from 'react';

const AdminSchedulingAction = ({ onClick }) => (
  <button className="action-btn admin-action" onClick={onClick}>
    <div className="action-icon">⚙️</div>
    <div className="action-text">
      <div className="action-title">Admin Scheduling</div>
      <div className="action-description">Manage resources & bookings</div>
    </div>
  </button>
);

export default AdminSchedulingAction;
