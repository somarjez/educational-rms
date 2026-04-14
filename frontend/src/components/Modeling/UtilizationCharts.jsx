import React from 'react';
import { FiAlertCircle, FiBarChart2, FiLayers } from 'react-icons/fi';

const clampPercent = (value) => Math.max(0, Math.min(100, Number(value || 0)));

const formatPercent = (value) => `${clampPercent(value).toFixed(1)}%`;

const formatNumber = (value) => new Intl.NumberFormat().format(Number(value || 0));

const getStatusColor = (status) => {
  switch (status) {
    case 'optimal':
      return '#2563eb';
    case 'underutilized':
      return '#f59e0b';
    case 'overutilized':
      return '#ef4444';
    default:
      return '#64748b';
  }
};

const UtilizationCharts = ({
  data,
  resourceType = 'rooms',
  loading = false,
  isFallback = false,
  fallbackReason = '',
}) => {
  const resources = Array.isArray(data?.resources) ? data.resources : [];
  const totalResources = Number(data?.summary?.totalResources || resources.length || 0);
  const overallPct = clampPercent(data?.overallUtilizationPct);
  const usedUnits = Number(data?.usedUnits || 0);
  const totalUnits = Number(data?.totalUnits || 0);
  const unitLabel = data?.unitLabel || (resourceType === 'equipment' ? 'units' : 'slots');
  const usedLabel = data?.usedLabel || (resourceType === 'equipment' ? 'assigned' : 'booked');
  const availableLabel = data?.availableLabel || 'available';
  const topResources = resources.slice(0, 6);
  const topValue = topResources.length > 0
    ? Math.max(...topResources.map((resource) => clampPercent(resource.utilization)), 1)
    : 1;

  const segmentData = [
    {
      key: 'underutilized',
      label: 'Underutilized',
      value: Number(data?.summary?.underutilized || 0),
      color: '#f59e0b',
    },
    {
      key: 'optimal',
      label: 'Optimal',
      value: Number(data?.summary?.optimal || 0),
      color: '#2563eb',
    },
    {
      key: 'overutilized',
      label: 'Overutilized',
      value: Number(data?.summary?.overutilized || 0),
      color: '#ef4444',
    },
  ];

  const ringColor = overallPct >= 75 ? '#ef4444' : overallPct >= 40 ? '#2563eb' : '#f59e0b';
  const ringBackground = `conic-gradient(${ringColor} 0 ${overallPct}%, rgba(148, 163, 184, 0.18) ${overallPct}% 100%)`;
  const remainingUnits = Math.max(totalUnits - usedUnits, 0);

  return (
    <section className="utilization-charts-section">
      <div className="utilization-charts-header">
        <div>
          <h2 className="utilization-charts-title">Utilization Charts</h2>
          <p className="utilization-charts-subtitle">
            Visualize how the selected resources are being consumed on the chosen date.
          </p>
        </div>

        <div className="utilization-charts-badges">
          <span className={`utilization-data-pill ${loading ? 'loading' : ''}`}>
            {loading ? 'Syncing live data' : isFallback ? 'Fallback preview' : 'Live data'}
          </span>
          <span className="utilization-source-note">
            {fallbackReason || (resourceType === 'equipment' ? 'Equipment allocation view' : 'Room utilization view')}
          </span>
        </div>
      </div>

      {isFallback ? (
        <div className="utilization-callout">
          <FiAlertCircle />
          <span>
            Live utilization records were unavailable, so the charts are showing a safe preview dataset.
          </span>
        </div>
      ) : null}

      <div className="utilization-summary-grid">
        <article className="utilization-summary-card highlight">
          <span className="summary-label">Overall Utilization</span>
          <strong className="summary-value">{formatPercent(overallPct)}</strong>
          <span className="summary-caption">Across {totalResources} tracked resources</span>
        </article>

        <article className="utilization-summary-card">
          <span className="summary-label">{usedLabel.charAt(0).toUpperCase() + usedLabel.slice(1)}</span>
          <strong className="summary-value">{formatNumber(usedUnits)} {unitLabel}</strong>
          <span className="summary-caption">Out of {formatNumber(totalUnits)} total {unitLabel}</span>
        </article>

        <article className="utilization-summary-card">
          <span className="summary-label">Availability</span>
          <strong className="summary-value">
            {formatNumber(remainingUnits)} {unitLabel}
          </strong>
          <span className="summary-caption">Currently {availableLabel}</span>
        </article>
      </div>

      <div className="utilization-chart-grid">
        <article className="utilization-chart-card ring-card">
          <div className="chart-card-header">
            <div>
              <h3>Capacity Snapshot</h3>
              <p>Used vs. available capacity for the selected view.</p>
            </div>
            <FiBarChart2 className="chart-card-icon" />
          </div>

          <div className="utilization-ring-wrap">
            <div className="utilization-ring" style={{ background: ringBackground }}>
              <div className="utilization-ring-inner">
                <strong>{formatPercent(overallPct)}</strong>
                <span>{resourceType === 'equipment' ? 'assignment rate' : 'room utilization'}</span>
              </div>
            </div>

            <div className="utilization-ring-caption">
              <span>{formatNumber(usedUnits)} {unitLabel} used</span>
              <span>{formatNumber(remainingUnits)} {unitLabel} remaining</span>
            </div>
          </div>

          <div className="utilization-legend">
            <span>
              <i style={{ background: ringColor }} />
              Used
            </span>
            <span>
              <i style={{ background: 'rgba(148, 163, 184, 0.4)' }} />
              Remaining
            </span>
          </div>
        </article>

        <article className="utilization-chart-card bars-card">
          <div className="chart-card-header">
            <div>
              <h3>Top Resources</h3>
              <p>Highest utilization appears first for quick review.</p>
            </div>
            <FiLayers className="chart-card-icon" />
          </div>

          {topResources.length > 0 ? (
            <div className="utilization-bar-list">
              {topResources.map((resource) => {
                const statusColor = getStatusColor(resource.status);

                return (
                  <div className="utilization-bar-row" key={resource.id}>
                    <div className="utilization-bar-meta">
                      <div>
                        <strong>{resource.name}</strong>
                        <span>{resource.metaA} • {resource.metaB}</span>
                      </div>
                      <span className="utilization-bar-value" style={{ color: statusColor }}>
                        {formatPercent(resource.utilization)}
                      </span>
                    </div>

                    <div className="utilization-bar-track">
                      <div
                        className="utilization-bar-fill"
                        style={{
                          width: `${(clampPercent(resource.utilization) / topValue) * 100}%`,
                          background: `linear-gradient(90deg, ${statusColor}, ${statusColor}cc)`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="utilization-empty-state">
              No utilization data is available for the selected filters.
            </div>
          )}
        </article>
      </div>

      <article className="utilization-chart-card distribution-card">
        <div className="chart-card-header">
          <div>
            <h3>Utilization Mix</h3>
            <p>Breakdown of tracked resources by utilization band.</p>
          </div>
        </div>

        <div className="utilization-segment-strip">
          {segmentData.map((segment) => {
            const width = totalResources > 0
              ? Math.max((segment.value / totalResources) * 100, segment.value > 0 ? 8 : 0)
              : 0;

            return (
              <div className="utilization-segment-item" key={segment.key}>
                <div className="utilization-segment-track">
                  <div
                    className="utilization-segment-fill"
                    style={{ width: `${width}%`, backgroundColor: segment.color }}
                  />
                </div>
                <div className="utilization-segment-labels">
                  <span>{segment.label}</span>
                  <strong>{segment.value}</strong>
                </div>
              </div>
            );
          })}
        </div>
      </article>
    </section>
  );
};

export default UtilizationCharts;