import React from 'react';
import { FiDownload } from 'react-icons/fi';

const SimulationProcessChart = ({
  timelineBars,
  playbackIndex,
  throughputPerHour,
  currentFrame,
  getTimelineBarClass,
  onExport,
}) => {
  return (
    <div className="card">
      <div className="card-header">
        <h2>Simulation Process Bar Graph</h2>
        <button className="btn-export" onClick={onExport}>
          <FiDownload /> Export Results
        </button>
      </div>
      <div className="sim-process-chart-wrap">
        <div className="sim-process-axis-label">Utilization (%)</div>
        <div className="sim-process-chart">
          <div className="sim-process-grid">
            <span>100%</span>
            <span>75%</span>
            <span>50%</span>
            <span>25%</span>
            <span>0%</span>
          </div>
          <div className="sim-process-bars">
            {timelineBars.map((bar, idx) => (
              <div key={`${bar.period}-${idx}`} className="sim-process-bar-item">
                <div
                  className={`sim-process-bar ${getTimelineBarClass(bar.utilization)} ${idx === playbackIndex ? 'active' : ''}`}
                  title={`${bar.period}: ${bar.utilization.toFixed(1)}%`}
                  style={{
                    height: `${Math.max(6, bar.normalized)}%`,
                    animationDelay: `${idx * 0.05}s`,
                  }}
                />
                <span className="sim-process-label">{idx + 1}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="sim-process-meta">
          <span>Metric: Utilization</span>
          <span>Average throughput: {throughputPerHour.toFixed(1)} jobs/hour</span>
          <span>Highlighted: {currentFrame?.period || 'N/A'}</span>
        </div>
      </div>
    </div>
  );
};

export default SimulationProcessChart;
