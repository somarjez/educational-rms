import React, { useMemo, useState } from 'react';
import './styles/CategoryVisualizations.css';

/**
 * SimulationComparison - Multi-scenario metric table and comparative analysis
 * Displays metrics across multiple simulations with highlighting and recommendations
 */
const SimulationComparison = ({ simulationResults = [], selectedMetric = 'avg_waiting_time' }) => {
  const [metricKey, setMetricKey] = useState(selectedMetric);

  const getMetricValue = (result, metric) => {
    const metrics = result?.metrics || {};
    let value = metrics[metric] || 0;
    if (metric === 'server_utilization' && value < 1) {
      value *= 100;
    }
    return value;
  };

  // Metrics available for comparison
  const metricsOptions = [
    { key: 'avg_waiting_time', label: 'Avg Wait Time (s)', unit: 's' },
    { key: 'avg_queue_length', label: 'Avg Queue Length', unit: 'items' },
    { key: 'server_utilization', label: 'Server Utilization', unit: '%' },
    { key: 'avg_system_time', label: 'Avg System Time (s)', unit: 's' },
    { key: 'max_queue_length', label: 'Max Queue Length', unit: 'items' },
  ];

  // Find best and worst performers
  const { best, worst, comparisons } = useMemo(() => {
    if (!simulationResults || simulationResults.length === 0) {
      return { best: null, worst: null, comparisons: [] };
    }

    const metric = metricKey;
    const data = simulationResults.map((result) => ({
      ...result,
      metricValue: getMetricValue(result, metric),
    }));

    // Sort to find best/worst
    const sorted =
      metric === 'server_utilization'
        ? [...data].sort((a, b) => a.metricValue - b.metricValue)
        : [...data].sort((a, b) => a.metricValue - b.metricValue);

    return {
      best: sorted[0],
      worst: sorted[sorted.length - 1],
      comparisons: data,
    };
  }, [simulationResults, metricKey]);

  // Utility function to get category label
  const getCategoryLabel = (simulationType) => {
    const labels = {
      room_usage: '🏢 Room Usage',
      equipment_usage: '⚙️ Equipment Usage',
      peak_hour: '📈 Peak Hour',
      shortage: '⚠️ Shortage Analysis',
      what_if: '❓ What-If Scenario',
      general: '📊 General',
    };
    return labels[simulationType] || simulationType;
  };

  // Utility function to determine performance status
  const getPerformanceStatus = (result) => {
    const wait = result.metrics?.avg_waiting_time || 0;
    const util = result.metrics?.server_utilization || 0;

    if (wait > 5 || util > 0.85) return { level: 'Critical', color: '#d32f2f', icon: '🔴' };
    if (wait > 2 || util > 0.70) return { level: 'High', color: '#ff9800', icon: '🟠' };
    if (wait > 1 || util > 0.50) return { level: 'Moderate', color: '#fdc107', icon: '🟡' };
    return { level: 'Healthy', color: '#66bb6a', icon: '🟢' };
  };

  // Format numeric values
  const formatValue = (value, unit) => {
    if (unit === '%') {
      return `${Number(value).toFixed(1)}%`;
    }
    return `${Number(value).toFixed(2)} ${unit}`;
  };

  if (!simulationResults || simulationResults.length === 0) {
    return (
      <div className="category-visualization">
        <div className="viz-header">
          <h3>Simulation Comparison</h3>
        </div>
        <div style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
          No simulation results to compare. Run simulations to populate this view.
        </div>
      </div>
    );
  }

  const currentMetric = metricsOptions.find((m) => m.key === metricKey);
  return (
    <div className="category-visualization">
      <div className="viz-header">
        <div>
          <h3>Simulation Comparison Dashboard</h3>
          <div className="header-description">Analyzing {simulationResults.length} simulation scenarios</div>
        </div>
      </div>

      {/* Metric Selection */}
      <div style={{ marginBottom: '24px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
        {metricsOptions.map((metric) => (
          <button
            key={metric.key}
            className={`control-btn sm ${metricKey === metric.key ? 'active' : ''}`}
            style={{
              backgroundColor: metricKey === metric.key ? '#2196f3' : '#e0e0e0',
              color: metricKey === metric.key ? 'white' : '#666',
            }}
            onClick={() => setMetricKey(metric.key)}
          >
            {metric.label}
          </button>
        ))}
      </div>

      {/* Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '24px',
        }}
      >
        <div className="scenario-card best">
          <div className="card-header">
            <h3>✅ Best Performance</h3>
          </div>
          <div className="card-content">
            <div className="impact-metric">
              <label>Scenario</label>
              <div className="metric-value">{getCategoryLabel(best?.simulation_type)}</div>
            </div>
            <div className="impact-metric">
              <label>{currentMetric?.label}</label>
              <div className="metric-value">
                {formatValue(best?.metricValue, currentMetric?.unit)}
              </div>
            </div>
            <div className="scenario-metrics">
              <div className="metric-row">
                <span className="metric-label">Wait Time:</span>
                <span className="metric-val">
                  {formatValue(best?.metrics?.avg_waiting_time, 's')}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Utilization:</span>
                <span className="metric-val">
                  {formatValue(best?.metrics?.server_utilization || 0, '%')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="scenario-card worst">
          <div className="card-header">
            <h3>❌ Worst Performance</h3>
          </div>
          <div className="card-content">
            <div className="impact-metric">
              <label>Scenario</label>
              <div className="metric-value">{getCategoryLabel(worst?.simulation_type)}</div>
            </div>
            <div className="impact-metric">
              <label>{currentMetric?.label}</label>
              <div className="metric-value">
                {formatValue(worst?.metricValue, currentMetric?.unit)}
              </div>
            </div>
            <div className="scenario-metrics">
              <div className="metric-row">
                <span className="metric-label">Wait Time:</span>
                <span className="metric-val">
                  {formatValue(worst?.metrics?.avg_waiting_time, 's')}
                </span>
              </div>
              <div className="metric-row">
                <span className="metric-label">Utilization:</span>
                <span className="metric-val">
                  {formatValue(worst?.metrics?.server_utilization || 0, '%')}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="scenario-card" style={{ borderLeftColor: '#2196f3' }}>
          <div className="card-header">
            <h3>📊 Performance Spread</h3>
          </div>
          <div className="card-content">
            <div className="impact-metric">
              <label>Total Scenarios</label>
              <div className="metric-value">{simulationResults.length}</div>
            </div>
            <div className="impact-metric">
              <label>Metric Range</label>
              <div className="metric-value">
                {formatValue(worst?.metricValue - best?.metricValue, currentMetric?.unit)}
              </div>
            </div>
            <div className="impact-metric">
              <label>Range Percentage</label>
              <div className="metric-value">
                {best?.metricValue > 0
                  ? (
                    ((worst?.metricValue - best?.metricValue) / best?.metricValue) *
                    100
                  ).toFixed(1)
                  : 0}
                %
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Comparison Table */}
      <div className="comparison-table-section">
        <h4>Detailed Metric Comparison</h4>
        <div className="table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Scenario Type</th>
                <th>Status</th>
                <th>Wait Time</th>
                <th>Queue Length</th>
                <th>Utilization</th>
                <th>System Time</th>
              </tr>
            </thead>
            <tbody>
              {comparisons.map((result, idx) => {
                const isRow = result.simulation_type;
                const status = getPerformanceStatus(result);
                const isBest = best && result.id === best.id;
                const isWorst = worst && result.id === worst.id;

                return (
                  <tr key={idx} className={isBest ? 'highlight-row' : ''}>
                    <td className="scenario-name">
                      {getCategoryLabel(isRow)}
                      {isBest && ' ⭐'}
                      {isWorst && ' 📉'}
                    </td>
                    <td>
                      <span
                        className="status"
                        style={{
                          backgroundColor: status.color,
                        }}
                      >
                        {status.icon} {status.level}
                      </span>
                    </td>
                    <td className="metric-cell">
                      {formatValue(result.metrics?.avg_waiting_time || 0, 's')}
                    </td>
                    <td className="metric-cell">
                      {formatValue(result.metrics?.avg_queue_length || 0, 'items')}
                    </td>
                    <td className="metric-cell">
                      {formatValue(result.metrics?.server_utilization || 0, '%')}
                    </td>
                    <td className="metric-cell">
                      {formatValue(result.metrics?.avg_system_time || 0, 's')}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Recommendations */}
      <div className="recommendations-section">
        <h4>💡 Comparative Recommendations</h4>
        <div className="recommendations-list">
          <div className="recommendation-item severity-high">
            <div className="rec-header">
              <span className="rec-type badge">BEST CHOICE</span>
            </div>
            <div className="rec-message">
              {getCategoryLabel(best?.simulation_type)} shows the best overall performance with{' '}
              <strong>{formatValue(best?.metrics?.avg_waiting_time, 's')} average wait time</strong> and{' '}
              <strong>{formatValue(best?.metrics?.server_utilization || 0, '%')} utilization</strong>.
            </div>
            <div className="rec-action">
              <strong>Action:</strong> Consider this scenario as your ideal operational target.
            </div>
          </div>

          {worst?.simulation_type !== best?.simulation_type && (
            <div className="recommendation-item severity-critical">
              <div className="rec-header">
                <span className="rec-type badge">WORST CHOICE</span>
              </div>
              <div className="rec-message">
                {getCategoryLabel(worst?.simulation_type)} shows challenges with{' '}
                <strong>{formatValue(worst?.metrics?.avg_waiting_time, 's')} average wait time</strong> and{' '}
                <strong>
                  {((worst?.metricValue - best?.metricValue) / best?.metricValue * 100).toFixed(0)}%
                </strong>{' '}
                worse performance than baseline.
              </div>
              <div className="rec-action">
                <strong>Action:</strong> Investigate resources constraints and bottlenecks in this scenario.
              </div>
            </div>
          )}

          {comparisons.some((r) => {
            const util = r.metrics?.server_utilization || 0;
            return util > 0.85;
          }) && (
            <div className="recommendation-item severity-high">
              <div className="rec-header">
                <span className="rec-type badge">CAPACITY WARNING</span>
              </div>
              <div className="rec-message">
                Some scenarios show equipment utilization exceeding 85%, indicating potential bottlenecks and
                service degradation under peak loads.
              </div>
              <div className="rec-action">
                <strong>Action:</strong> Plan capacity expansion or request prioritization for high-stress
                scenarios.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Performance Insights */}
      <div className="whatif-insights">
        <h4>📊 Comparative Analysis Insights</h4>
        <div className="insights-grid">
          <div className="insight-card">
            <span className="insight-label">Average Wait Time</span>
            <span className="insight-value">
              {formatValue(
                comparisons.reduce((sum, r) => sum + (r.metrics?.avg_waiting_time || 0), 0) /
                comparisons.length,
                's'
              )}
            </span>
          </div>

          <div className="insight-card">
            <span className="insight-label">Average Utilization</span>
            <span className="insight-value">
              {formatValue(
                (comparisons.reduce((sum, r) => sum + (r.metrics?.server_utilization || 0), 0) /
                comparisons.length) * 100,
                '%'
              )}
            </span>
          </div>

          <div className="insight-card">
            <span className="insight-label">Highest Wait Time</span>
            <span className="insight-value">
              {formatValue(
                Math.max(...comparisons.map((r) => r.metrics?.avg_waiting_time || 0)),
                's'
              )}
            </span>
          </div>

          <div className="insight-card">
            <span className="insight-label">Most Utilized</span>
            <span className="insight-value">
              {formatValue(
                Math.max(...comparisons.map((r) => r.metrics?.server_utilization || 0)) * 100,
                '%'
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimulationComparison;
