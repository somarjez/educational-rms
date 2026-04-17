import React from 'react';
import { FiArrowRight, FiBarChart2 } from 'react-icons/fi';

const DisplayUtilizationChartsAction = ({ onClick }) => (
  <button className="action-btn utilization-action" onClick={onClick} type="button">
    <div className="action-icon">
      <FiBarChart2 />
    </div>
    <div className="action-text">
      <div className="action-title">Display Utilization Charts</div>
      <div className="action-description">Open the Resource Utilization Model</div>
    </div>
    <div className="action-arrow" aria-hidden="true">
      <FiArrowRight />
    </div>
  </button>
);

export default DisplayUtilizationChartsAction;