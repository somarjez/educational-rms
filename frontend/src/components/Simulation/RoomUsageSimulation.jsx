import React from 'react';
import SimulationTemplate from './SimulationTemplate';

const RoomUsageSimulation = () => {
  return (
    <SimulationTemplate
      title="Room Usage Simulation"
      description="Simulate room booking patterns over time to predict utilization trends"
      simulationType="room-usage"
    />
  );
};

export default RoomUsageSimulation;
