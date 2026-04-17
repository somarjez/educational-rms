import React from 'react';
import { DashboardChartBarIcon } from '../../icons/DashboardIcons';

const buttonStyle = { background: '#67b8f5', color: '#ffffff' };
const iconStyle = { background: 'rgba(255, 255, 255, 0.16)' };
const titleStyle = { color: '#ffffff' };
const descriptionStyle = { color: '#7a8597' };

const DisplayUtilizationChartsAction = ({ onClick }) => (
  <button className="action-btn utilization-action" onClick={onClick} type="button" style={buttonStyle}>
    <div className="action-icon" style={iconStyle}>
      <DashboardChartBarIcon />
    </div>
    <div className="action-text">
      <div className="action-title" style={titleStyle}>Display Utilization Charts</div>
      <div className="action-description" style={descriptionStyle}>Open the Resource Utilization Model</div>
    </div>
  </button>
);

export default DisplayUtilizationChartsAction;
