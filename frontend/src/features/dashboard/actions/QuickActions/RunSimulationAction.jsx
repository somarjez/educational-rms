import React from 'react';

const RunSimulationAction = ({ onClick }) => (
  <button className="action-btn" onClick={onClick}>
    <div className="action-icon">📊</div>
    <div className="action-text">
      <div className="action-title">Run Simulation</div>
      <div className="action-description">Analyze usage patterns</div>
    </div>
  </button>
);

export default RunSimulationAction;
