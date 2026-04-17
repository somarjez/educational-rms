import React from 'react';
import SimulationTemplate from './SimulationTemplate';

const ShortageScenario = () => {
  return (
    <SimulationTemplate
      title="Shortage Scenario Simulation"
      description="Analyze impacts of resource shortages"
      simulationType="shortage"
    />
  );
};

export default ShortageScenario;
