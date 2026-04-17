import React from 'react';
import { FiActivity } from 'react-icons/fi';

const buttonStyle = { background: '#f2a33a', color: '#ffffff' };
const iconStyle = { background: 'rgba(255, 255, 255, 0.18)' };
const titleStyle = { color: '#ffffff' };
const descriptionStyle = { color: '#24398e' };

const RunSimulationActionClean = ({ onClick }) => (
  <button className="action-btn" onClick={onClick} type="button" style={buttonStyle}>
    <div className="action-icon" style={iconStyle}>
      <FiActivity />
    </div>
    <div className="action-text">
      <div className="action-title" style={titleStyle}>Run Simulation</div>
      <div className="action-description" style={descriptionStyle}>Analyze usage patterns</div>
    </div>
  </button>
);

export default RunSimulationActionClean;
