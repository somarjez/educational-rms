import React from 'react';
import { DashboardWrenchIcon } from '../../icons/DashboardIcons';

const buttonStyle = { background: '#8d744d', color: '#ffffff' };
const iconStyle = { background: 'rgba(255, 255, 255, 0.18)' };
const textStyle = { color: '#ffffff' };

const RequestEquipmentActionClean = ({ onClick }) => (
  <button className="action-btn" onClick={onClick} type="button" style={buttonStyle}>
    <div className="action-icon" style={iconStyle}>
      <DashboardWrenchIcon />
    </div>
    <div className="action-text">
      <div className="action-title" style={textStyle}>Request Equipment</div>
      <div className="action-description" style={textStyle}>Request equipment via booking</div>
    </div>
  </button>
);

export default RequestEquipmentActionClean;
