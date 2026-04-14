import React from 'react';

const SimulationSummaryCards = ({ metrics, throughputPerHour, pressuredRooms }) => {
  return (
    <div className="summary-cards">
      <div className="card summary-card">
        <div className="card-value">{((metrics.server_utilization || 0) * 100).toFixed(1)}%</div>
        <div className="card-label">Server Utilization</div>
      </div>
      <div className="card summary-card">
        <div className="card-value">{Number(metrics.served_count_avg || 0).toFixed(0)}</div>
        <div className="card-label">Avg Served Jobs</div>
      </div>
      <div className="card summary-card">
        <div className="card-value">{throughputPerHour.toFixed(1)}/h</div>
        <div className="card-label">Throughput</div>
      </div>
      <div className="card summary-card optimal">
        <div className="card-value">{pressuredRooms}</div>
        <div className="card-label">High-Load Rooms</div>
      </div>
    </div>
  );
};

export default SimulationSummaryCards;
