import React, { useMemo } from 'react';
import { useSimulationAnimation } from '../hooks';
import './styles/CategoryVisualizations.css';

/**
 * WhatIfMatrix - Grid of what-if scenarios with comparisons
 * Shows demand multiplier scenarios and their effects
 */
const WhatIfMatrix = ({ result, categoryMetrics }) => {
  const animation = useSimulationAnimation(categoryMetrics, true);
  const scenarios = useMemo(() => {
    if (!categoryMetrics?.scenario_comparisons) {
      return [];
    }
    return categoryMetrics.scenario_comparisons;
  }, [categoryMetrics]);

  const bestPerformer = categoryMetrics?.best_performer;
  const worstPerformer = categoryMetrics?.worst_performer;
  const recommendations = categoryMetrics?.recommendations || [];

  const breakpointScenario = useMemo(() => {
    return scenarios.find((s) => s.utilization > 0.85) || null;
  }, [scenarios]);

  const maxWait = useMemo(() => {
    return scenarios.length > 0 ? Math.max(...scenarios.map((s) => s.avg_wait_time)) : 0;
  }, [scenarios]);

  const maxUtil = useMemo(() => {
    return scenarios.length > 0 ? Math.max(...scenarios.map((s) => s.utilization)) : 0;
  }, [scenarios]);

  const getScenarioStatus = (scenario) => {
    if (scenario.multiplier < 1.0) {
      return { level: 'Underutilized', color: '#66bb6a', icon: '↓' };
    }
    if (scenario.multiplier === 1.0) {
      return { level: 'Baseline', color: '#2196f3', icon: '=' };
    }
    if (scenario.multiplier <= 1.25) {
      return { level: 'Optimal', color: '#ff9800', icon: '→' };
    }
    return { level: 'Overloaded', color: '#d32f2f', icon: '↑' };
  };

  const renderScenarioComparisonCard = (scenario) => {
    const status = getScenarioStatus(scenario);
    const waitBar = maxWait > 0 ? (scenario.avg_wait_time / maxWait) * 100 : 0;
    const utilBar = maxUtil > 0 ? (scenario.utilization / maxUtil) * 100 : 0;
    const isBest = bestPerformer && Math.abs(scenario.multiplier - bestPerformer.multiplier) < 0.01;
    const isWorst = worstPerformer && Math.abs(scenario.multiplier - worstPerformer.multiplier) < 0.01;
    const isActive = scenarios.length > 0 && scenario === scenarios[animation.currentTimeIndex % scenarios.length];

    return (
      <div
        key={scenario.multiplier}
        className={`scenario-comparison-card ${isBest ? 'best' : ''} ${isWorst ? 'worst' : ''} ${isActive ? 'active-scenario' : ''}`}
      >
        {isBest && <div className="card-badge best-badge">⭐ Best</div>}
        {isWorst && <div className="card-badge worst-badge">📉 Worst</div>}

        <div className="scenario-header">
          <div className="demand-label">{scenario.demand_label}</div>
          <span className="status-badge" style={{ backgroundColor: status.color }}>
            {status.icon} {status.level}
          </span>
        </div>

        <div className="scenario-metrics-grid">
          {/* Wait Time */}
          <div className="metric-block">
            <label>Wait Time</label>
            <div className="metric-display">
              <div className="metric-value">{scenario.avg_wait_time.toFixed(2)}s</div>
              <div className="metric-bar mini">
                <div
                  className="metric-bar-fill"
                  style={{
                    width: `${waitBar}%`,
                    backgroundColor: scenario.avg_wait_time > 0.3 ? '#d32f2f' : '#66bb6a',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Queue Length */}
          <div className="metric-block">
            <label>Queue Length</label>
            <div className="metric-display">
              <div className="metric-value">{scenario.avg_queue_length.toFixed(2)}</div>
              <div className="metric-bar mini" />
            </div>
          </div>

          {/* Utilization */}
          <div className="metric-block">
            <label>Utilization</label>
            <div className="metric-display">
              <div className="metric-value">{(scenario.utilization * 100).toFixed(0)}%</div>
              <div className="metric-bar mini">
                <div
                  className="metric-bar-fill"
                  style={{
                    width: `${utilBar}%`,
                    backgroundColor:
                      scenario.utilization > 0.85 ? '#d32f2f' : scenario.utilization > 0.65 ? '#ff9800' : '#66bb6a',
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Comparison to Baseline (1.0x) */}
        {scenario.multiplier !== 1.0 && (
          <div className="comparison-to-baseline">
            <small>{scenario.multiplier > 1.0 ? '⬆️ Above' : '⬇️ Below'} baseline</small>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="category-visualization what-if-matrix-viz">
      <div className="viz-header">
        <h3>What-If Scenario Analysis</h3>
        <div className="header-description">
          Comparing system performance across different demand scenarios
        </div>
      </div>

      {/* Scenario Grid */}
      <div className="animation-controls">
        <button className="control-btn" onClick={animation.togglePlayback}>
          {animation.isPlaying ? '⏸ Pause Scenario Loop' : '▶ Auto Cycle Scenarios'}
        </button>
        <button className="control-btn" onClick={animation.reset}>⏮ Reset</button>
      </div>

      <div className="scenarios-grid">
        {scenarios.map((scenario) => renderScenarioComparisonCard(scenario))}
      </div>

      {/* Comparison Table */}
      <div className="comparison-table-section">
        <h4>Detailed Comparison</h4>
        <div className="table-wrapper">
          <table className="comparison-table">
            <thead>
              <tr>
                <th>Scenario</th>
                <th>Demand Multiplier</th>
                <th>Wait Time</th>
                <th>Queue Length</th>
                <th>Utilization</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map((scenario) => {
                const status = getScenarioStatus(scenario);
                const isBest = bestPerformer && Math.abs(scenario.multiplier - bestPerformer.multiplier) < 0.01;

                return (
                  <tr key={scenario.multiplier} className={isBest ? 'highlight-row' : ''}>
                    <td className="scenario-name">{scenario.demand_label}</td>
                    <td className="metric-cell">{scenario.multiplier.toFixed(2)}x</td>
                    <td className="metric-cell">{scenario.avg_wait_time.toFixed(2)}s</td>
                    <td className="metric-cell">{scenario.avg_queue_length.toFixed(2)}</td>
                    <td className="metric-cell">{(scenario.utilization * 100).toFixed(1)}%</td>
                    <td>
                      <span className="status" style={{ backgroundColor: status.color }}>
                        {status.level}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Best and Worst Performers */}
      <div className="performers-section">
        <div className="performer-card best">
          <h4>✅ Best Performer</h4>
          {bestPerformer ? (
            <>
              <div className="performer-demand">{bestPerformer.demand_label}</div>
              <div className="performer-metric">
                <span className="label">Wait Time:</span>
                <span className="value">{bestPerformer.avg_wait_time.toFixed(2)}s</span>
              </div>
              <div className="performer-metric">
                <span className="label">Utilization:</span>
                <span className="value">{(bestPerformer.utilization * 100).toFixed(0)}%</span>
              </div>
            </>
          ) : (
            <p>No data available</p>
          )}
        </div>

        <div className="performer-card worst">
          <h4>❌ Worst Performer</h4>
          {worstPerformer ? (
            <>
              <div className="performer-demand">{worstPerformer.demand_label}</div>
              <div className="performer-metric">
                <span className="label">Wait Time:</span>
                <span className="value">{worstPerformer.avg_wait_time.toFixed(2)}s</span>
              </div>
              <div className="performer-metric">
                <span className="label">Utilization:</span>
                <span className="value">{(worstPerformer.utilization * 100).toFixed(0)}%</span>
              </div>
            </>
          ) : (
            <p>No data available</p>
          )}
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="whatif-recommendations">
          <h4>💡 Recommendations for High-Demand Scenarios</h4>
          <div className="recommendations-list">
            {recommendations.map((rec, idx) => (
              <div key={idx} className="recommendation-card">
                <div className="rec-scenario">{rec.scenario}</div>
                <div className="rec-finding">{rec.finding}</div>
                <div className="rec-action">→ {rec.action}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insights */}
      <div className="whatif-insights">
        <h4>📊 Key Insights</h4>
        <div className="insights-grid">
          <div className="insight-card">
            <span className="insight-label">Optimal Range</span>
            <span className="insight-value">
              {scenarios.find((s) => s.multiplier === 1.0)?.demand_label || 'N/A'} performs best
            </span>
          </div>

          <div className="insight-card">
            <span className="insight-label">Max Acceptable Wait</span>
            <span className="insight-value">
              {scenarios.reduce((max, s) => Math.max(max, s.avg_wait_time), 0).toFixed(2)}s at highest demand
            </span>
          </div>

          <div className="insight-card">
            <span className="insight-label">Breakpoint</span>
            <span className="insight-value">
              Utilization exceeds 85% at{' '}
              {breakpointScenario?.demand_label || '> 150% demand'}
            </span>
          </div>

          <div className="insight-card">
            <span className="insight-label">Capacity Headroom</span>
            <span className="insight-value">
              Current system can handle up to{' '}
              {(
                scenarios.reduce((max, s) => Math.max(max, s.multiplier), 0) * 1.1
              ).toFixed(1)}
              x demand safely
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatIfMatrix;
