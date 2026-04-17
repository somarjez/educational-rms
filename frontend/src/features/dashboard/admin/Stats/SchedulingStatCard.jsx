import React from 'react';

const SchedulingStatCard = ({ icon, value, label, className = '' }) => (
  <div className={`scheduling-stat-card ${className}`}>
    <div className="stat-icon-large">{icon}</div>
    <div className="stat-info">
      <p className="stat-value">{value}</p>
      <p className="stat-label">{label}</p>
    </div>
  </div>
);

export default SchedulingStatCard;
