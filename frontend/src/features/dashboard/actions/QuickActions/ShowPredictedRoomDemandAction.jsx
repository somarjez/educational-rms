import React from 'react';
import { FiArrowRight, FiTrendingUp } from 'react-icons/fi';

const ShowPredictedRoomDemandAction = ({ onClick }) => (
  <button className="action-btn demand-action" onClick={onClick} type="button">
    <div className="action-icon">
      <FiTrendingUp />
    </div>
    <div className="action-text">
      <div className="action-title">Show Predicted Room Demand</div>
      <div className="action-description">View the Demand Forecasting Model</div>
    </div>
    <div className="action-arrow" aria-hidden="true">
      <FiArrowRight />
    </div>
  </button>
);

export default ShowPredictedRoomDemandAction;
