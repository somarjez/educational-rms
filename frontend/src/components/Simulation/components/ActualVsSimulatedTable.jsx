import React from 'react';

const ActualVsSimulatedTable = ({ actualVsSimulated }) => {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Actual vs Simulated Results</h2>
      </div>
      <table className="timeline-table">
        <thead>
          <tr>
            <th>Metric</th>
            <th>Actual (Observed)</th>
            <th>Simulated</th>
            <th>Delta</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Throughput / hour</td>
            <td className="value">{actualVsSimulated.actualThroughputPerHour.toFixed(2)}</td>
            <td className="value">{actualVsSimulated.simulatedThroughputPerHour.toFixed(2)}</td>
            <td className="value">{actualVsSimulated.throughputDeltaPct.toFixed(1)}%</td>
          </tr>
          <tr>
            <td>System Load</td>
            <td className="value">{actualVsSimulated.actualLoadPct.toFixed(1)}%</td>
            <td className="value">{actualVsSimulated.simulatedLoadPct.toFixed(1)}%</td>
            <td className="value">{actualVsSimulated.loadDeltaPct.toFixed(1)}%</td>
          </tr>
          <tr>
            <td>Avg Processing/System Time</td>
            <td className="value">{actualVsSimulated.actualServiceTime.toFixed(2)}h</td>
            <td className="value">{actualVsSimulated.simulatedSystemTime.toFixed(2)}h</td>
            <td className="value">{actualVsSimulated.timeDeltaPct.toFixed(1)}%</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

export default ActualVsSimulatedTable;
