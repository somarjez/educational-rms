import React from 'react';

const RequestEquipmentAction = ({ onClick }) => (
  <button className="action-btn" onClick={onClick}>
    <div className="action-icon">🛠️</div>
    <div className="action-text">
      <div className="action-title">Request Equipment</div>
      <div className="action-description">Request equipment via booking</div>
    </div>
  </button>
);

export default RequestEquipmentAction;
