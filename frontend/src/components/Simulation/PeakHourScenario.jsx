import React from 'react';
import SimulationTemplate from './SimulationTemplate';

const PeakHourScenario = () => {
  return (
    <SimulationTemplate
      title="Peak-Hour Scenario Simulation"
      description="Test resource systems under high-demand conditions"
      simulationType="peak-hour"
    />
  );
};

export default PeakHourScenario;
