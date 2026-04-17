import React, { useMemo } from 'react';
import './styles/CategoryVisualizations.css';

/**
 * EquipmentUsageVisualization - Equipment utilization and queue metrics
 */
const EquipmentUsageVisualization = ({ result, categoryMetrics }) => {
  const metrics = result?.metrics || {};
  const equipmentStats = categoryMetrics || {};

  const utilizationDisplay = useMemo(() => {
    const util = equipmentStats.avg_equipment_utilization || 0;
    if (util >= 0.85) return { level: 'Critical', color: '#d32f2f', icon: '🔴' };
    if (util >= 0.70) return { level: 'High', color: '#ff9800', icon: '🟠' };
    if (util >= 0.50) return { level: 'Moderate', color: '#fdd835', icon: '🟡' };
    return { level: 'Low', color: '#66bb6a', icon: '🟢' };
  }, [equipmentStats.avg_equipment_utilization]);

  return (
    <div className="category-visualization equipment-usage-viz">
      <div className="viz-header">
        <h3>Equipment Usage Analysis</h3>
        <div className="status-indicator">
          <span className="status-badge" style={{ backgroundColor: utilizationDisplay.color }}>
            {utilizationDisplay.icon} {utilizationDisplay.level} Utilization
          </span>
        </div>
      </div>

      {/* Main Metrics */}
      <div className="metrics-grid">
        {/* Utilization Gauge */}
        <div className="gauge-card">
          <h4>Equipment Utilization</h4>
          <div className="gauge-container">
            <div className="circular-gauge">
              <svg viewBox="0 0 100 100" className="gauge-svg">
                {/* Background circle */}
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e0e0e0" strokeWidth="3" />
                {/* Utilization arc */}
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke={utilizationDisplay.color}
                  strokeWidth="3"
                  strokeDasharray={`${(equipmentStats.avg_equipment_utilization || 0) * 251.2} 251.2`}
                  strokeLinecap="round"
                />
                {/* Center text */}
                <text x="50" y="50" textAnchor="middle" dy="0.3em" fontSize="20" fontWeight="bold">
                  {((equipmentStats.avg_equipment_utilization || 0) * 100).toFixed(0)}%
                </text>
              </svg>
            </div>
          </div>
        </div>

        {/* Downtime Card */}
        <div className="metric-card">
          <h4>Equipment Downtime</h4>
          <div className="metric-value">{(equipmentStats.equipment_downtime_percentage || 0).toFixed(1)}%</div>
          <div className="metric-description">Time equipment is idle</div>
          <div className="metric-bar">
            <div
              className="metric-bar-fill"
              style={{
                width: `${equipmentStats.equipment_downtime_percentage || 0}%`,
                backgroundColor: '#ff9800',
              }}
            />
          </div>
        </div>

        {/* Wait Time Card */}
        <div className="metric-card">
          <h4>Average Wait for Equipment</h4>
          <div className="metric-value">{(equipmentStats.avg_waiting_for_equipment || 0).toFixed(2)}s</div>
          <div className="metric-description">Avg queue wait time</div>
        </div>
      </div>

      {/* Queue Statistics */}
      <div className="queue-stats-section">
        <h4>Queue Dynamics</h4>
        <div className="queue-grid">
          <div className="queue-stat">
            <label>Average Queue Length</label>
            <div className="queue-value">
              {equipmentStats.equipment_queue_statistics?.avg_queue_length?.toFixed(2) || 'N/A'}
            </div>
            <div className="queue-unit">items</div>
          </div>

          <div className="queue-stat">
            <label>Max Queue Observed</label>
            <div className="queue-value">
              {equipmentStats.equipment_queue_statistics?.max_queue_observed || 'N/A'}
            </div>
            <div className="queue-unit">items</div>
          </div>

          <div className="queue-stat">
            <label>Server Utilization</label>
            <div className="queue-value">{((metrics.server_utilization || 0) * 100).toFixed(1)}%</div>
            <div className="queue-unit">of capacity</div>
          </div>

          <div className="queue-stat">
            <label>Avg System Time</label>
            <div className="queue-value">{(metrics.avg_system_time || 0).toFixed(2)}s</div>
            <div className="queue-unit">total time</div>
          </div>
        </div>
      </div>

      {/* Status Card */}
      <div className="status-card">
        <h4>Equipment Status</h4>

        <div className="status-row">
          <span className="status-label">Utilization Level:</span>
          <span className={`status-value level-${utilizationDisplay.level.toLowerCase()}`}>
            {utilizationDisplay.level}
          </span>
        </div>

        <div className="status-row">
          <span className="status-label">Active Equipment:</span>
          <span className="status-value">Operating at {((equipmentStats.avg_equipment_utilization || 0) * 100).toFixed(1)}%</span>
        </div>

        <div className="status-row">
          <span className="status-label">Queue Status:</span>
          <span className="status-value">
            {equipmentStats.equipment_queue_statistics?.avg_queue_length > 2
              ? '⚠️ Queue buildup detected'
              : '✓ Healthy queue levels'}
          </span>
        </div>

        <div className="status-row">
          <span className="status-label">Average Wait:</span>
          <span className="status-value">
            {equipmentStats.avg_waiting_for_equipment > 5 ? '⚠️ Long waits' : '✓ Acceptable waits'} (
            {equipmentStats.avg_waiting_for_equipment?.toFixed(2)}s)
          </span>
        </div>
      </div>

      {/* Recommendations */}
      <div className="recommendations-section">
        <h4>💡 Insights</h4>
        <div className="insights-list">
          {equipmentStats.avg_equipment_utilization > 0.85 && (
            <div className="insight critical">
              <span className="icon">⚠️</span>
              <span className="text">Equipment is operating near maximum capacity. Consider expanding equipment availability.</span>
            </div>
          )}

          {equipmentStats.equipment_queue_statistics?.avg_queue_length > 2 && (
            <div className="insight warning">
              <span className="icon">📊</span>
              <span className="text">Queue lengths are building. Equipment demand may exceed current capacity.</span>
            </div>
          )}

          {equipmentStats.avg_waiting_for_equipment > 3 && (
            <div className="insight warning">
              <span className="icon">⏱️</span>
              <span className="text">Wait times are increasing. Service time optimization or additional equipment needed.</span>
            </div>
          )}

          {equipmentStats.avg_equipment_utilization <= 0.50 && (
            <div className="insight info">
              <span className="icon">ℹ️</span>
              <span className="text">Equipment utilization is low. Current capacity is sufficient.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EquipmentUsageVisualization;
