import React, { useMemo } from 'react';
import { useSimulationAnimation } from '../hooks';
import './styles/CategoryVisualizations.css';

/**
 * PeakHourVisualization - Bar chart showing demand and stress by hour
 * Identifies bottlenecks and peak stress periods
 */
const PeakHourVisualization = ({ result, categoryMetrics }) => {
  const animation = useSimulationAnimation(categoryMetrics, true);

  const peakData = useMemo(() => {
    if (!categoryMetrics?.peak_hours_analysis) {
      return [];
    }
    return categoryMetrics.peak_hours_analysis;
  }, [categoryMetrics]);

  const getStressColor = (stressLevel) => {
    if (stressLevel === 'high') return '#d32f2f'; // Red
    if (stressLevel === 'medium') return '#ff9800'; // Orange
    return '#66bb6a'; // Green
  };

  const maxWait = useMemo(() => {
    return peakData.length > 0 ? Math.max(...peakData.map((h) => h.avg_wait_time)) : 0;
  }, [peakData]);

  const maxArrivals = useMemo(() => {
    return peakData.length > 0 ? Math.max(...peakData.map((h) => h.avg_arrivals)) : 0;
  }, [peakData]);

  return (
    <div className="category-visualization peak-hour-viz">
      <div className="viz-header">
        <h3>Peak Hour Analysis - 1.7x Demand</h3>
        <div className="peak-indicator">
          {categoryMetrics?.peak_stress_hour !== undefined && (
            <span className="peak-badge">
              Peak Stress: Hour {categoryMetrics.peak_stress_hour} 
              ({categoryMetrics.peak_stress_value?.toFixed(2)}s wait)
            </span>
          )}
        </div>
      </div>

      <div className="peak-chart-container">
        {/* Wait Time Chart */}
        <div className="chart-section">
          <h4>Average Wait Time by Hour</h4>
          <div className="bar-chart">
            {peakData.map((hour, idx) => {
              const barHeight = maxWait > 0 ? (hour.avg_wait_time / maxWait) * 100 : 0;
              const isHighlight = idx === animation.currentTimeIndex;

              return (
                <div
                  key={idx}
                  className={`bar-container ${hour.stress_level} ${isHighlight ? 'highlighted' : ''}`}
                  onClick={() => animation.seek(idx)}
                  title={`Hour ${hour.hour}: ${hour.avg_wait_time.toFixed(2)}s wait`}
                >
                  <div
                    className="bar"
                    style={{
                      height: `${barHeight}%`,
                      backgroundColor: getStressColor(hour.stress_level),
                    }}
                  />
                  <div className="bar-label">
                    <span className="hour">H{hour.hour}</span>
                    <span className="value">{hour.avg_wait_time.toFixed(1)}s</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Demand Chart */}
        <div className="chart-section">
          <h4>Arrival Demand by Hour</h4>
          <div className="bar-chart demand">
            {peakData.map((hour, idx) => {
              const barHeight = maxArrivals > 0 ? (hour.avg_arrivals / maxArrivals) * 100 : 0;
              const isHighlight = idx === animation.currentTimeIndex;

              return (
                <div
                  key={idx}
                  className={`bar-container demand-bar ${isHighlight ? 'highlighted' : ''}`}
                  onClick={() => animation.seek(idx)}
                  title={`Hour ${hour.hour}: ${hour.avg_arrivals.toFixed(0)} arrivals`}
                >
                  <div
                    className="bar"
                    style={{
                      height: `${barHeight}%`,
                      backgroundColor: '#2196f3',
                    }}
                  />
                  <div className="bar-label">
                    <span className="hour">H{hour.hour}</span>
                    <span className="value">{hour.avg_arrivals.toFixed(0)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Current Hour Details */}
      {peakData[animation.currentTimeIndex] && (
        <div className="peak-hour-details">
          <div className="detail-panel">
            <div className="detail-group">
              <label>Hour</label>
              <div className="detail-value">{peakData[animation.currentTimeIndex].hour}</div>
            </div>

            <div className="detail-group">
              <label>Wait Time</label>
              <div className="detail-value">
                {peakData[animation.currentTimeIndex].avg_wait_time.toFixed(2)}s
              </div>
            </div>

            <div className="detail-group">
              <label>Max Queue Length</label>
              <div className="detail-value">
                {peakData[animation.currentTimeIndex].max_queue_length?.toFixed(1) || 'N/A'}
              </div>
            </div>

            <div className="detail-group">
              <label>Arrivals</label>
              <div className="detail-value">{peakData[animation.currentTimeIndex].avg_arrivals.toFixed(0)}</div>
            </div>

            <div className="detail-group">
              <label>Stress Level</label>
              <div className={`detail-value stress-level ${peakData[animation.currentTimeIndex].stress_level}`}>
                {peakData[animation.currentTimeIndex].stress_level?.toUpperCase() || 'UNKNOWN'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Animation Controls */}
      <div className="animation-controls">
        <button
          className="control-btn"
          onClick={animation.togglePlayback}
          title={animation.isPlaying ? 'Pause' : 'Play'}
        >
          {animation.isPlaying ? '⏸ Pause' : '▶ Play'}
        </button>

        <button className="control-btn" onClick={animation.reset} title="Reset">
          ⏮ Reset
        </button>

        <div className="speed-control">
          <button
            className="control-btn sm"
            onClick={animation.slowDown}
            disabled={animation.animationSpeed <= 0.25}
            title="Slow down"
          >
            -
          </button>
          <span className="speed-display">Speed: {animation.animationSpeed.toFixed(2)}x</span>
          <button
            className="control-btn sm"
            onClick={animation.speedUp}
            disabled={animation.animationSpeed >= 2}
            title="Speed up"
          >
            +
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="summary-stats">
        <div className="stat">
          <label>Peak Stress Hour</label>
          <div className="stat-value">Hour {categoryMetrics?.peak_stress_hour || 'N/A'}</div>
        </div>
        <div className="stat">
          <label>System Stress Level</label>
          <div className={`stat-value stress-level ${categoryMetrics?.system_stress_level || 'moderate'}`}>
            {categoryMetrics?.system_stress_level?.toUpperCase() || 'MODERATE'}
          </div>
        </div>
        <div className="stat">
          <label>Demand Multiplier</label>
          <div className="stat-value">{categoryMetrics?.demand_multiplier || 1}x</div>
        </div>
      </div>

      {/* Bottleneck Identification */}
      <div className="bottleneck-section">
        <h4>⚠️ Identified Bottlenecks</h4>
        <div className="bottleneck-list">
          {peakData
            .filter((h) => h.stress_level === 'high')
            .map((hour, idx) => (
              <div key={idx} className="bottleneck-item">
                <span className="bottleneck-hour">Hour {hour.hour}</span>
                <span className="bottleneck-detail">
                  {hour.avg_wait_time.toFixed(2)}s wait, {hour.avg_arrivals.toFixed(0)} arrivals
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};

export default PeakHourVisualization;
