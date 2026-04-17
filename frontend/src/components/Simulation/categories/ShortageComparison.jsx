import React, { useMemo } from 'react';
import { useSimulationAnimation } from '../hooks';
import './styles/CategoryVisualizations.css';

/**
 * ShortageComparison - Side-by-side comparison of shortage scenarios
 * Shows room shortage, equipment shortage, and combined shortage impacts
 */
const ShortageComparison = ({ result, categoryMetrics }) => {
  const animation = useSimulationAnimation(categoryMetrics, true);
  const shortageImpact = categoryMetrics?.shortage_impact || {};
  const recommendations = categoryMetrics?.recommendations || [];

  const scenarioComparison = useMemo(() => {
    return categoryMetrics?.scenario_comparison || {};
  }, [categoryMetrics]);

  const getImpactSeverity = (waitIncrease) => {
    if (waitIncrease > 400) return { level: 'Critical', color: '#d32f2f', icon: '🔴' };
    if (waitIncrease > 200) return { level: 'High', color: '#ff9800', icon: '🟠' };
    if (waitIncrease > 100) return { level: 'Moderate', color: '#fdd835', icon: '🟡' };
    return { level: 'Low', color: '#66bb6a', icon: '🟢' };
  };

  const scenarioEntries = useMemo(() => {
    return [
      {
        title: '🏢 Room Shortage (65% capacity)',
        data: scenarioComparison.room_shortage,
        impactKey: 'room_shortage_impact',
      },
      {
        title: '⚙️ Equipment Shortage (70% capacity)',
        data: scenarioComparison.equipment_shortage,
        impactKey: 'equipment_shortage_impact',
      },
      {
        title: '⚠️ Combined Shortage (50% capacity)',
        data: scenarioComparison.combined,
        impactKey: 'combined_impact',
      },
    ];
  }, [scenarioComparison]);

  const activeScenarioIndex = scenarioEntries.length
    ? (animation.currentTimeIndex % scenarioEntries.length)
    : 0;

  const renderScenarioCard = (title, data, impactKey, cardIndex) => {
    const impact = shortageImpact[impactKey] || {};
    const waitIncrease = impact.wait_time_increase_pct || 0;
    const queueIncrease = impact.queue_length_increase_pct || 0;
    const severity = getImpactSeverity(waitIncrease);

    return (
      <div className={`scenario-card ${cardIndex === activeScenarioIndex ? 'active-scenario' : ''}`} key={title}>
        <div className="card-header" style={{ borderLeftColor: severity.color }}>
          <h3>{title}</h3>
          <span className="severity-badge" style={{ backgroundColor: severity.color }}>
            {severity.icon} {severity.level}
          </span>
        </div>

        <div className="card-content">
          {/* Wait Time Impact */}
          <div className="impact-metric">
            <label>Wait Time Increase</label>
            <div className="metric-value impact-value">
              {waitIncrease.toFixed(1)}%
            </div>
            <div className="metric-bar">
              <div
                className="metric-bar-fill"
                style={{
                  width: `${Math.min(100, Math.abs(waitIncrease) / 5)}%`,
                  backgroundColor: severity.color,
                }}
              />
            </div>
          </div>

          {/* Queue Length Impact */}
          <div className="impact-metric">
            <label>Queue Length Increase</label>
            <div className="metric-value impact-value">
              {queueIncrease.toFixed(1)}%
            </div>
            <div className="metric-bar">
              <div
                className="metric-bar-fill"
                style={{
                  width: `${Math.min(100, Math.abs(queueIncrease) / 5)}%`,
                  backgroundColor: severity.color,
                }}
              />
            </div>
          </div>

          {/* Unmet Demand */}
          <div className="impact-metric">
            <label>Unmet Demand</label>
            <div className="metric-value">
              {impact.unmet_demand || 0}
              <span className="metric-unit">requests</span>
            </div>
          </div>

          {/* Scenario Metrics */}
          <div className="scenario-metrics">
            {data && (
              <>
                <div className="metric-row">
                  <span className="metric-label">Avg Wait Time:</span>
                  <span className="metric-val">{(data.avg_waiting_time || 0).toFixed(2)}s</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Queue Length:</span>
                  <span className="metric-val">{(data.avg_queue_length || 0).toFixed(2)}</span>
                </div>
                <div className="metric-row">
                  <span className="metric-label">Utilization:</span>
                  <span className="metric-val">{((data.server_utilization || 0) * 100).toFixed(1)}%</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="category-visualization shortage-comparison-viz">
      <div className="viz-header">
        <h3>Shortage Impact Analysis</h3>
        <div className="header-description">
          Comparing impact of resource shortages on system performance
        </div>
      </div>

      {/* Three-Column Comparison */}
      <div className="animation-controls">
        <button className="control-btn" onClick={animation.togglePlayback}>
          {animation.isPlaying ? '⏸ Pause Cycle' : '▶ Auto Cycle'}
        </button>
        <button className="control-btn" onClick={animation.reset}>⏮ Reset</button>
      </div>

      <div className="scenario-grid">
        {scenarioEntries.map((entry, idx) =>
          renderScenarioCard(entry.title, entry.data, entry.impactKey, idx)
        )}
      </div>

      {/* Comparison Summary */}
      <div className="comparison-summary">
        <h4>Impact Comparison</h4>
        <div className="summary-table">
          <div className="table-header">
            <div className="col scenario">Scenario</div>
            <div className="col metric">Wait Time ↑</div>
            <div className="col metric">Queue Length ↑</div>
            <div className="col metric">Severity</div>
          </div>

          <div className="table-row">
            <div className="col scenario">Room Shortage</div>
            <div className="col metric">
              {(shortageImpact.room_shortage_impact?.wait_time_increase_pct || 0).toFixed(1)}%
            </div>
            <div className="col metric">
              {(shortageImpact.room_shortage_impact?.queue_length_increase_pct || 0).toFixed(1)}%
            </div>
            <div className="col metric">
              <span className="badge high">HIGH</span>
            </div>
          </div>

          <div className="table-row">
            <div className="col scenario">Equipment Shortage</div>
            <div className="col metric">
              {(shortageImpact.equipment_shortage_impact?.wait_time_increase_pct || 0).toFixed(1)}%
            </div>
            <div className="col metric">
              {(shortageImpact.equipment_shortage_impact?.queue_length_increase_pct || 0).toFixed(1)}%
            </div>
            <div className="col metric">
              <span className="badge medium">MEDIUM</span>
            </div>
          </div>

          <div className="table-row highlighted">
            <div className="col scenario">Combined Shortage</div>
            <div className="col metric">
              {(shortageImpact.combined_impact?.wait_time_increase_pct || 0).toFixed(1)}%
            </div>
            <div className="col metric">
              {(shortageImpact.combined_impact?.queue_length_increase_pct || 0).toFixed(1)}%
            </div>
            <div className="col metric">
              <span className="badge critical">CRITICAL</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <div className="recommendations-panel">
          <h4>📋 Recommendations</h4>
          <div className="recommendations-list">
            {recommendations.map((rec, idx) => (
              <div key={idx} className={`recommendation-item severity-${rec.severity}`}>
                <div className="rec-header">
                  <span className="rec-type badge">{rec.type?.replace(/_/g, ' ').toUpperCase()}</span>
                  <span className={`rec-severity severity-${rec.severity}`}>
                    {rec.severity?.toUpperCase()}
                  </span>
                </div>
                <div className="rec-message">{rec.message}</div>
                <div className="rec-action">
                  <strong>Action:</strong> {rec.action}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Key Findings */}
      <div className="key-findings">
        <h4>🔍 Key Findings</h4>
        <div className="findings-list">
          {shortageImpact.room_shortage_impact?.wait_time_increase_pct > 300 && (
            <div className="finding critical">
              Room shortages have a <strong>severe impact</strong> on wait times, increasing them by over
              {' '}
              <strong>
                {(shortageImpact.room_shortage_impact?.wait_time_increase_pct || 0).toFixed(0)}%
              </strong>
            </div>
          )}

          {shortageImpact.combined_impact?.wait_time_increase_pct > shortageImpact.room_shortage_impact?.wait_time_increase_pct &&
            (
            <div className="finding warning">
              Combined shortage has the <strong>most severe impact</strong> on the system, with wait times
              increasing by <strong>{(shortageImpact.combined_impact?.wait_time_increase_pct || 0).toFixed(0)}%</strong>
            </div>
          )}

          {Math.abs(
            (shortageImpact.room_shortage_impact?.wait_time_increase_pct || 0) -
              (shortageImpact.equipment_shortage_impact?.wait_time_increase_pct || 0)
          ) < 100 && (
            <div className="finding info">
              Room and equipment shortages have <strong>comparable impacts</strong> on wait times. Both
              resources are important for system performance.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShortageComparison;
