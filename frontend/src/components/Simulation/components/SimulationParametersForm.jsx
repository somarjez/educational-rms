import React from 'react';
import { FiPlay } from 'react-icons/fi';

const SimulationParametersForm = ({
  simulationParams,
  rooms,
  equipment,
  onParamChange,
  onRunSimulation,
  isRunning,
  isLoading,
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Simulation Parameters</h2>
      </div>
      <div className="params-grid">
        <div className="param-input">
          <label>History Window (days)</label>
          <input
            type="number"
            min="1"
            max="120"
            value={simulationParams.lookbackDays}
            onChange={(e) => onParamChange('lookbackDays', Number(e.target.value))}
          />
        </div>
        <div className="param-input">
          <label>Simulation Hours</label>
          <input
            type="number"
            min="1"
            max="24"
            value={simulationParams.simulationHours}
            onChange={(e) => onParamChange('simulationHours', Number(e.target.value))}
          />
        </div>
        <div className="param-input">
          <label>Demand Multiplier</label>
          <input
            type="number"
            min="0.5"
            max="4"
            step="0.05"
            value={simulationParams.demandMultiplier}
            onChange={(e) => onParamChange('demandMultiplier', Number(e.target.value))}
          />
        </div>
        <div className="param-input">
          <label>Service Distribution</label>
          <select
            value={simulationParams.serviceDistribution}
            onChange={(e) => onParamChange('serviceDistribution', e.target.value)}
          >
            <option value="exponential">Exponential</option>
            <option value="fixed">Fixed</option>
          </select>
        </div>
        <div className="param-input">
          <label>Monte Carlo Iterations</label>
          <input
            type="number"
            min="100"
            step="100"
            value={simulationParams.iterations}
            onChange={(e) => onParamChange('iterations', Number(e.target.value))}
          />
        </div>
        {simulationParams.serviceDistribution === 'exponential' ? (
          <div className="param-input">
            <label>Service Rate (/hour)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={simulationParams.serviceRate}
              onChange={(e) => onParamChange('serviceRate', Number(e.target.value))}
            />
          </div>
        ) : (
          <div className="param-input">
            <label>Fixed Service Time (hours)</label>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={simulationParams.serviceTime}
              onChange={(e) => onParamChange('serviceTime', Number(e.target.value))}
            />
          </div>
        )}
        <div className="param-input">
          <label>Room Scope</label>
          <select
            value={simulationParams.selectedRoomId}
            onChange={(e) => onParamChange('selectedRoomId', e.target.value)}
          >
            <option value="">All Rooms</option>
            {rooms.map((room) => (
              <option value={room.id} key={room.id}>
                {room.name}
              </option>
            ))}
          </select>
        </div>
        <div className="param-input">
          <label>Equipment Scope</label>
          <select
            value={simulationParams.selectedEquipmentId}
            onChange={(e) => onParamChange('selectedEquipmentId', e.target.value)}
          >
            <option value="">All Equipment</option>
            {equipment.map((eq) => (
              <option value={eq.id} key={eq.id}>
                {eq.name}
              </option>
            ))}
          </select>
        </div>
        <button
          className="btn-run-simulation"
          onClick={onRunSimulation}
          disabled={isRunning || isLoading}
        >
          <FiPlay /> {isRunning ? 'Running...' : 'Run Simulation'}
        </button>
      </div>
    </div>
  );
};

export default SimulationParametersForm;
