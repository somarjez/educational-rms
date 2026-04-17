import React from 'react';

const SimulationInsightsCard = ({
  adjustedArrivalRate,
  throughputPerHour,
  simulationHours,
  pressuredRooms,
  replications,
}) => {
  return (
    <div className="card info-card">
      <h3>Key Insights</h3>
      <ul>
        <li>Estimated arrival rate: {adjustedArrivalRate.toFixed(2)} requests/hour based on real bookings and scenario multipliers.</li>
        <li>Average throughput is {throughputPerHour.toFixed(1)} jobs/hour across {Number(simulationHours || 0)} simulated hours.</li>
        <li>{pressuredRooms} room(s) are currently in high-load pressure zones and may need balancing.</li>
        <li>The simulator used {Number(replications)} Monte Carlo replications for confidence.</li>
      </ul>
    </div>
  );
};

export default SimulationInsightsCard;
