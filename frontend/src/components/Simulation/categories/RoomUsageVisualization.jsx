import React, { useMemo } from 'react';
import { useSimulationAnimation } from '../hooks';
import './styles/CategoryVisualizations.css';

/**
 * RoomUsageVisualization - Timeline heatmap showing room occupancy by hour
 * Displays room utilization patterns with animation controls
 */
const RoomUsageVisualization = ({ result, categoryMetrics }) => {
  const animation = useSimulationAnimation(categoryMetrics, true);

  const roomData = useMemo(() => {
    if (!categoryMetrics?.room_utilization_by_hour) {
      return [];
    }
    return categoryMetrics.room_utilization_by_hour;
  }, [categoryMetrics]);

  const peakHour = useMemo(() => {
    if (!categoryMetrics?.peak_utilization_hour) {
      return null;
    }
    return categoryMetrics.peak_utilization_hour;
  }, [categoryMetrics]);

  const getHeatmapColor = (utilization) => {
    if (utilization >= 80) return '#d32f2f'; // Red - critical
    if (utilization >= 60) return '#ff9800'; // Orange - high
    if (utilization >= 40) return '#fdd835'; // Yellow - moderate
    return '#66bb6a'; // Green - low
  };

  const getUtilizationLabel = (utilization) => {
    if (utilization >= 80) return 'Critical';
    if (utilization >= 60) return 'High';
    if (utilization >= 40) return 'Moderate';
    return 'Low';
  };

  return (
    <div className="category-visualization room-usage-viz">
      <div className="viz-header">
        <h3>Room Occupancy Timeline</h3>
        <div className="peak-indicator">
          {peakHour && (
            <span className="peak-badge">
              Peak: Hour {peakHour.hour} @ {peakHour.occupancy_rate.toFixed(1)}%
            </span>
          )}
        </div>
      </div>

      {/* Heatmap Grid */}
      <div className="heatmap-container">
        <div className="heatmap-grid">
          {roomData.map((hour, idx) => (
            <div
              key={idx}
              className={`heatmap-cell ${idx === animation.currentTimeIndex ? 'active' : ''}`}
              style={{
                backgroundColor: getHeatmapColor(hour.occupancy_rate),
              }}
              title={`Hour ${hour.hour}: ${hour.occupancy_rate.toFixed(1)}% occupancy`}
            >
              <div className="cell-label">
                <div className="hour-number">H{hour.hour}</div>
                <div className="occupancy-pct">{hour.occupancy_rate.toFixed(0)}%</div>
              </div>
            </div>
          ))}
        </div>

        {/* Timeline Scrubber */}
        <div className="timeline-scrubber">
          <input
            type="range"
            min="0"
            max={Math.max(0, roomData.length - 1)}
            value={animation.currentTimeIndex}
            onChange={(e) => animation.seek(parseInt(e.target.value))}
            className="scrubber-slider"
          />
          <div className="time-display">
            Hour {animation.currentTimeIndex} / {roomData.length - 1}
          </div>
        </div>
      </div>

      {/* Hourly Details */}
      {roomData[animation.currentTimeIndex] && (
        <div className="hourly-details">
          <div className="detail-card">
            <label>Occupancy Rate</label>
            <div className="detail-value">{roomData[animation.currentTimeIndex].occupancy_rate.toFixed(1)}%</div>
            <div className="detail-label">{getUtilizationLabel(roomData[animation.currentTimeIndex].occupancy_rate)}</div>
          </div>

          <div className="detail-card">
            <label>Rooms in Use</label>
            <div className="detail-value">{roomData[animation.currentTimeIndex].avg_room_usage.toFixed(1)}</div>
            <div className="detail-label">Average</div>
          </div>

          <div className="detail-card">
            <label>Peak Demand</label>
            <div className="detail-value">{roomData[animation.currentTimeIndex].peak_demand}</div>
            <div className="detail-label">Arrivals this hour</div>
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

      {/* Legend */}
      <div className="heatmap-legend">
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#66bb6a' }}></div>
          <span>Low (&lt; 40%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#fdd835' }}></div>
          <span>Moderate (40-60%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#ff9800' }}></div>
          <span>High (60-80%)</span>
        </div>
        <div className="legend-item">
          <div className="legend-color" style={{ backgroundColor: '#d32f2f' }}></div>
          <span>Critical (≥ 80%)</span>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="summary-stats">
        <div className="stat">
          <label>Average Daily Occupancy</label>
          <div className="stat-value">
            {categoryMetrics?.avg_daily_utilization?.toFixed(1) || 'N/A'}%
          </div>
        </div>
        <div className="stat">
          <label>Total Hours Analyzed</label>
          <div className="stat-value">{roomData.length}</div>
        </div>
      </div>
    </div>
  );
};

export default RoomUsageVisualization;
