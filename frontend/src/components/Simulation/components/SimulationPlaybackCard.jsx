import React from 'react';
import { FiPause, FiPlay } from 'react-icons/fi';

const SimulationPlaybackCard = ({
  simulationType,
  categoryMetrics,
  currentFrame,
  playbackIndex,
  timelineBars,
  throughputPerHour,
  pressuredRooms,
  isPlaybackActive,
  setIsPlaybackActive,
  playbackSpeed,
  setPlaybackSpeed,
  roomFlowBranches,
  flowAgents,
  branchAgents,
  queueAgents,
  servingAgents,
  topAnimatedRooms,
  animationStateClass,
}) => {
  if (!currentFrame) {
    return null;
  }

  const variant = String(simulationType || 'room_usage').replace(/-/g, '_');
  const labelsByVariant = {
    room_usage: { entry: 'Entry', service: 'Service', exit: 'Exit' },
    equipment_usage: { entry: 'Requests', service: 'Equipment', exit: 'Dispatch' },
    peak_hour: { entry: 'Surge In', service: 'Queue', exit: 'Clear Out' },
    shortage: { entry: 'Limited In', service: 'Bottleneck', exit: 'Spillover' },
    what_if: { entry: 'Scenario A', service: 'Processor', exit: 'Scenario B' },
  };
  const labels = labelsByVariant[variant] || labelsByVariant.room_usage;
  const cappedQueue = Math.min(28, queueAgents);
  const cappedService = Math.min(16, servingAgents);
  const mood = currentFrame.utilization > 80 ? 'hyped' : currentFrame.utilization > 55 ? 'busy' : 'chill';

  const worldPresets = {
    room_usage: {
      title: 'Room Routing Town',
      humans: [
        { id: 'ava', name: 'Ava', outfit: 'outfit-red', expression: mood === 'hyped' ? 'wow' : 'smile', trait: 'guide' },
        { id: 'leo', name: 'Leo', outfit: 'outfit-blue', expression: mood === 'busy' ? 'focus' : 'grin', trait: 'navigator' },
        { id: 'maya', name: 'Maya', outfit: 'outfit-green', expression: 'happy', trait: 'room scout' },
      ],
      objects: [
        { id: 'chair', label: 'Chair', role: 'walking-chair' },
        { id: 'lamp', label: 'Lamp', role: 'talking-lamp' },
        { id: 'table', label: 'Table', role: 'walking-table' },
        { id: 'burger', label: 'Snack', role: 'bouncy-food' },
      ],
      humanLine: 'Room crew, route guests to the least busy room.',
      objectLine: 'Copy that. We are marching to Room B!',
      energyLabel: 'Route Energy',
    },
    equipment_usage: {
      title: 'Equipment Factory',
      humans: [
        { id: 'sam', name: 'Sam', outfit: 'outfit-blue', expression: 'focus', trait: 'operator' },
        { id: 'nia', name: 'Nia', outfit: 'outfit-green', expression: 'smile', trait: 'mechanic' },
        { id: 'jo', name: 'Jo', outfit: 'outfit-red', expression: 'grin', trait: 'dispatcher' },
      ],
      objects: [
        { id: 'drill', label: 'Drill', role: 'talking-lamp' },
        { id: 'cart', label: 'Cart', role: 'walking-table' },
        { id: 'bench', label: 'Bench', role: 'walking-chair' },
        { id: 'box', label: 'Supply', role: 'bouncy-food' },
      ],
      humanLine: 'Keep the machine queue smooth and balanced.',
      objectLine: 'Slots open. Rolling tools to station 3!',
      energyLabel: 'Machine Tempo',
    },
    peak_hour: {
      title: 'Rush Hour Avenue',
      humans: [
        { id: 'ivy', name: 'Ivy', outfit: 'outfit-red', expression: 'wow', trait: 'traffic lead' },
        { id: 'rex', name: 'Rex', outfit: 'outfit-blue', expression: 'focus', trait: 'queue marshal' },
        { id: 'kai', name: 'Kai', outfit: 'outfit-green', expression: 'surprised', trait: 'time keeper' },
      ],
      objects: [
        { id: 'sign', label: 'Sign', role: 'talking-lamp' },
        { id: 'cone', label: 'Cone', role: 'walking-chair' },
        { id: 'bench', label: 'Bench', role: 'walking-table' },
        { id: 'snack', label: 'Donut', role: 'bouncy-food' },
      ],
      humanLine: 'Big surge incoming, stagger arrivals now.',
      objectLine: 'Lane lights flashing. Peak wave detected!',
      energyLabel: 'Surge Heat',
    },
    shortage: {
      title: 'Bottleneck Borough',
      humans: [
        { id: 'mia', name: 'Mia', outfit: 'outfit-green', expression: 'focus', trait: 'allocator' },
        { id: 'den', name: 'Den', outfit: 'outfit-red', expression: 'surprised', trait: 'responder' },
        { id: 'liz', name: 'Liz', outfit: 'outfit-blue', expression: 'grin', trait: 'planner' },
      ],
      objects: [
        { id: 'gate', label: 'Gate', role: 'walking-table' },
        { id: 'lamp', label: 'Alarm', role: 'talking-lamp' },
        { id: 'stool', label: 'Stool', role: 'walking-chair' },
        { id: 'food', label: 'Snack', role: 'bouncy-food' },
      ],
      humanLine: 'Capacity is tight. Prioritize urgent flow.',
      objectLine: 'Warning: blocked requests are piling up.',
      energyLabel: 'Constraint Load',
    },
    what_if: {
      title: 'Parallel Scenario Park',
      humans: [
        { id: 'zen', name: 'Zen', outfit: 'outfit-blue', expression: 'grin', trait: 'analyst A' },
        { id: 'ari', name: 'Ari', outfit: 'outfit-red', expression: 'smile', trait: 'analyst B' },
        { id: 'noa', name: 'Noa', outfit: 'outfit-green', expression: 'happy', trait: 'comparison lead' },
      ],
      objects: [
        { id: 'board', label: 'Board', role: 'walking-table' },
        { id: 'lamp', label: 'Beacon', role: 'talking-lamp' },
        { id: 'chair', label: 'Seat', role: 'walking-chair' },
        { id: 'cube', label: 'Cube', role: 'bouncy-food' },
      ],
      humanLine: 'Scenario A and B diverge. Compare outcomes.',
      objectLine: 'Crossing data streams now. Results syncing!',
      energyLabel: 'Scenario Flux',
    },
  };

  const worldPreset = worldPresets[variant] || worldPresets.room_usage;
  const categoryDecisionSupport = categoryMetrics?.decision_support || {};
  const recommendations = categoryMetrics?.recommendations || categoryDecisionSupport.recommendations || [];
  const roomSeries = categoryMetrics?.room_utilization_by_hour || [];
  const peakSeries = categoryMetrics?.peak_hours_analysis || [];
  const scenarioComparisons = categoryMetrics?.scenario_comparisons || [];
  const scenarioComparison = categoryMetrics?.scenario_comparison || {};
  const shortageImpact = categoryMetrics?.shortage_impact || {};
  const bestPerformer = categoryMetrics?.best_performer || null;
  const worstPerformer = categoryMetrics?.worst_performer || null;
  const breakpointScenario = scenarioComparisons.find((scenario) => Number(scenario.utilization || 0) > 0.85) || null;
  const activeTimelineBar = timelineBars?.[playbackIndex] || currentFrame;
  const maxWait = peakSeries.length > 0 ? Math.max(...peakSeries.map((h) => Number(h.avg_wait_time || 0))) : 0;
  const maxArrivals = peakSeries.length > 0 ? Math.max(...peakSeries.map((h) => Number(h.avg_arrivals || 0))) : 0;

  const safePercent = (value) => Number(Math.max(0, Math.min(100, Number(value) || 0)).toFixed(1));

  const renderTimelineStrip = (rows, activeIndex, valueLabel = 'Utilization') => (
    <div className="data-timeline-strip">
      {rows.map((row, idx) => (
        <button
          key={`${row.period}-${idx}`}
          type="button"
          className={`data-timeline-step ${idx === activeIndex ? 'active' : ''}`}
          title={`${row.period}: ${safePercent(row.utilization)}%`}
        >
          <span className="data-timeline-label">{row.period}</span>
          <span className="data-timeline-bar">
            <span className="data-timeline-fill" style={{ height: `${safePercent(row.utilization)}%` }} />
          </span>
          <span className="data-timeline-value">{safePercent(row.utilization)}%</span>
        </button>
      ))}
      {!rows.length && <div className="data-empty-state">No {valueLabel.toLowerCase()} series available.</div>}
    </div>
  );

  const renderVariantPanel = () => {
    if (variant === 'room_usage') {
      const activeHour = roomSeries[playbackIndex] || roomSeries[0] || null;

      return (
        <div className="data-variant-panel room-panel">
          <div className="data-panel-header">
            <h3>Room Utilization by Hour</h3>
            <span className="data-badge">Peak hour: {categoryMetrics?.peak_utilization_hour?.hour ?? 'N/A'}</span>
          </div>
          <div className="simulation-map simulation-map-room">
            <div className="simulation-map-topline">
              <div className="simulation-map-title">Classroom Utilization Map</div>
              <div className="simulation-map-meta">Active hour: {activeHour?.hour ?? 'N/A'}</div>
              <div className="simulation-map-meta">Utilization: {safePercent(currentFrame.utilization)}%</div>
            </div>

            <div className="simulation-map-grid">
              <div className="simulation-room-wing">
                {topAnimatedRooms.slice(0, 3).map((room, idx) => {
                  const occupancy = safePercent(room.relativePressure || room.loadPct);
                  const active = roomSeries.length ? idx % roomSeries.length === playbackIndex % Math.max(1, roomSeries.length) : idx === 0;
                  return (
                    <div key={room.roomId} className={`simulation-room-card ${active ? 'active' : ''}`}>
                      <div className="simulation-room-card-header">
                        <span className="simulation-room-name">{room.roomName}</span>
                        <span className="simulation-room-load">{occupancy}%</span>
                      </div>
                      <div className="simulation-room-internal">
                        <span className="simulation-room-door" />
                        <span className="simulation-room-window left" />
                        <span className="simulation-room-window right" />
                        <div className="simulation-room-seats">
                          {Array.from({ length: Math.max(2, Math.min(6, Math.round(occupancy / 16))) }).map((_, seatIdx) => (
                            <span
                              key={`${room.roomId}-seat-${seatIdx}`}
                              className="simulation-room-student"
                              style={{
                                animationDelay: `${(seatIdx * 0.14 + idx * 0.12) % 1.4}s`,
                                animationDuration: `${Math.max(1.4, 2.9 - occupancy / 70)}s`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="simulation-room-meter">
                        <span className="simulation-room-meter-fill" style={{ width: `${occupancy}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="simulation-corridor">
                <div className="simulation-corridor-label">Corridor Throughput</div>
                <div className="simulation-corridor-track" />
                {branchAgents.slice(0, 10).map((agent, idx) => (
                  <span
                    key={agent.id}
                    className={`simulation-corridor-agent lane-${idx % 3}`}
                    style={{
                      '--target-y': `${agent.targetY}%`,
                      animationDelay: `${agent.delay}s`,
                      animationDuration: `${agent.duration}s`,
                      opacity: Math.max(0.6, Math.min(1, agent.loadPct / 100)),
                    }}
                  />
                ))}
              </div>

              <div className="simulation-room-wing right">
                {topAnimatedRooms.slice(3, 6).map((room, idx) => {
                  const occupancy = safePercent(room.relativePressure || room.loadPct);
                  const active = roomSeries.length ? room.roomId === topAnimatedRooms[playbackIndex % Math.max(1, topAnimatedRooms.length)]?.roomId : idx === 0;
                  return (
                    <div key={room.roomId} className={`simulation-room-card ${active ? 'active' : ''}`}>
                      <div className="simulation-room-card-header">
                        <span className="simulation-room-name">{room.roomName}</span>
                        <span className="simulation-room-load">{occupancy}%</span>
                      </div>
                      <div className="simulation-room-internal">
                        <span className="simulation-room-door" />
                        <span className="simulation-room-window left" />
                        <span className="simulation-room-window right" />
                        <div className="simulation-room-seats">
                          {Array.from({ length: Math.max(2, Math.min(6, Math.round(occupancy / 16))) }).map((_, seatIdx) => (
                            <span
                              key={`${room.roomId}-seat-${seatIdx}`}
                              className="simulation-room-student"
                              style={{
                                animationDelay: `${(seatIdx * 0.14 + idx * 0.12) % 1.4}s`,
                                animationDuration: `${Math.max(1.4, 2.9 - occupancy / 70)}s`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="simulation-room-meter">
                        <span className="simulation-room-meter-fill" style={{ width: `${occupancy}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
          <div className="data-grid cards-3">
            <div className="data-card metric">
              <div className="metric-label">Average Daily Utilization</div>
              <div className="metric-value">{safePercent(categoryMetrics?.avg_daily_utilization)}%</div>
            </div>
            <div className="data-card metric">
              <div className="metric-label">Peak Hour Occupancy</div>
              <div className="metric-value">{safePercent(categoryMetrics?.peak_utilization_hour?.occupancy_rate)}%</div>
            </div>
            <div className="data-card metric">
              <div className="metric-label">Rooms Highlighted</div>
              <div className="metric-value">{pressuredRooms}</div>
            </div>
          </div>
          <div className="data-chart-grid">
            {roomSeries.map((hour, idx) => (
              <div key={`${hour.hour}-${idx}`} className={`data-chart-bar ${idx === playbackIndex ? 'active' : ''}`}>
                <div className="data-chart-track">
                  <div className="data-chart-fill" style={{ height: `${safePercent(hour.occupancy_rate)}%` }} />
                </div>
                <div className="data-chart-label">H{hour.hour}</div>
                <div className="data-chart-value">{safePercent(hour.occupancy_rate)}%</div>
              </div>
            ))}
          </div>
          <div className="data-detail-grid">
            {topAnimatedRooms.slice(0, 4).map((room) => (
              <div key={room.roomId} className="data-detail-card">
                <div className="data-detail-title">{room.roomName}</div>
                <div className="data-detail-value">{safePercent(room.relativePressure || room.loadPct)}%</div>
                <div className="data-detail-sub">Load pressure</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (variant === 'equipment_usage') {
      const equipmentTokens = Array.from({ length: Math.max(6, Math.min(18, Math.round((categoryMetrics?.avg_equipment_utilization || 0) * 20 || 8))) }).map((_, idx) => ({
        id: idx,
        delay: `${(idx * 0.13) % 1.4}s`,
        duration: `${Math.max(1.3, 3.1 - (Number(categoryMetrics?.avg_equipment_utilization || 0) * 1.2))}s`,
      }));
      const equipmentStations = topAnimatedRooms.slice(0, 4);

      return (
        <div className="data-variant-panel equipment-panel">
          <div className="data-panel-header">
            <h3>Equipment Throughput and Queue Pressure</h3>
            <span className="data-badge">Utilization {safePercent(categoryMetrics?.avg_equipment_utilization * 100)}%</span>
          </div>
          <div className="simulation-map simulation-map-equipment">
            <div className="simulation-map-topline">
              <div className="simulation-map-title">Equipment Operations Map</div>
              <div className="simulation-map-meta">Queue length: {Number(categoryMetrics?.equipment_queue_statistics?.avg_queue_length || 0).toFixed(2)}</div>
              <div className="simulation-map-meta">Wait time: {Number(categoryMetrics?.avg_waiting_for_equipment || 0).toFixed(2)}s</div>
              <div className="simulation-map-meta">Active utilization: {safePercent(categoryMetrics?.avg_equipment_utilization * 100)}%</div>
            </div>

            <div className="simulation-equipment-floor">
              <div className="simulation-equipment-stations">
                {equipmentStations.map((room, idx) => {
                  const load = safePercent(room.relativePressure || room.loadPct);
                  return (
                    <div key={room.roomId || idx} className="simulation-equipment-station">
                      <div className="simulation-equipment-station-title">{room.roomName || `Station ${idx + 1}`}</div>
                      <div className="simulation-equipment-station-body">
                        <span className="simulation-equipment-arm left" />
                        <span className="simulation-equipment-arm right" />
                        <span className="simulation-equipment-core" />
                        <div className="simulation-equipment-rack-gauge">
                          <span className="simulation-equipment-rack-fill" style={{ width: `${load}%` }} />
                        </div>
                      </div>
                      <div className="simulation-equipment-station-meta">{load}% loaded</div>
                    </div>
                  );
                })}
              </div>

              <div className="simulation-equipment-conveyor">
                <div className="simulation-equipment-conveyor-label">Request Conveyor</div>
                <div className="simulation-equipment-conveyor-track" />
                {equipmentTokens.map((token, idx) => (
                  <span
                    key={token.id}
                    className={`simulation-equipment-token lane-${idx % 3}`}
                    style={{ animationDelay: token.delay, animationDuration: token.duration }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="data-grid cards-3">
            <div className="data-card metric">
              <div className="metric-label">Equipment Utilization</div>
              <div className="metric-value">{safePercent(categoryMetrics?.avg_equipment_utilization * 100)}%</div>
            </div>
            <div className="data-card metric">
              <div className="metric-label">Queue Length</div>
              <div className="metric-value">{Number(categoryMetrics?.equipment_queue_statistics?.avg_queue_length || 0).toFixed(2)}</div>
            </div>
            <div className="data-card metric">
              <div className="metric-label">Avg Wait for Equipment</div>
              <div className="metric-value">{Number(categoryMetrics?.avg_waiting_for_equipment || 0).toFixed(2)}s</div>
            </div>
          </div>
          <div className="data-queue-visual">
            <div className="data-queue-label">Queue pressure from timeline</div>
            {renderTimelineStrip(timelineBars, playbackIndex, 'Utilization')}
          </div>
          <div className="data-detail-grid">
            <div className="data-detail-card">
              <div className="data-detail-title">Max Queue Observed</div>
              <div className="data-detail-value">{categoryMetrics?.equipment_queue_statistics?.max_queue_observed ?? 'N/A'}</div>
            </div>
            <div className="data-detail-card">
              <div className="data-detail-title">Downtime</div>
              <div className="data-detail-value">{safePercent(categoryMetrics?.equipment_downtime_percentage)}%</div>
            </div>
            <div className="data-detail-card">
              <div className="data-detail-title">System Time</div>
              <div className="data-detail-value">{Number(activeTimelineBar?.utilization || 0).toFixed(1)}%</div>
              <div className="data-detail-sub">Active frame utilization</div>
            </div>
          </div>
        </div>
      );
    }

    if (variant === 'peak_hour') {
      const activePeak = peakSeries[playbackIndex] || peakSeries[0] || null;
      const incomingPulses = Math.max(8, Math.min(22, cappedQueue));
      const servedPulses = Math.max(5, Math.min(18, cappedService));

      return (
        <div className="data-variant-panel peak-panel">
          <div className="data-panel-header">
            <h3>Peak Hour Stress Curve</h3>
            <span className="data-badge">Stress hour: {categoryMetrics?.peak_stress_hour ?? 'N/A'}</span>
          </div>
          <div className="simulation-map simulation-map-peak">
            <div className="simulation-map-topline">
              <div className="simulation-map-title">Peak Operations Map</div>
              <div className="simulation-map-meta">Active hour: {activePeak?.hour ?? 'N/A'}</div>
              <div className="simulation-map-meta">Avg arrivals: {Number(activePeak?.avg_arrivals || 0).toFixed(1)}</div>
              <div className="simulation-map-meta">Avg wait: {Number(activePeak?.avg_wait_time || 0).toFixed(2)}s</div>
            </div>

            <div className="simulation-peak-floor">
              <div className="simulation-peak-track incoming">
                <span className="simulation-peak-track-label">Inbound Demand</span>
                <div className="simulation-peak-track-lane" />
                {Array.from({ length: incomingPulses }).map((_, idx) => (
                  <span
                    key={`pk-in-${idx}`}
                    className="simulation-peak-token incoming"
                    style={{ animationDelay: `${(idx * 0.08) % 1.3}s` }}
                  />
                ))}
              </div>

              <div className="simulation-peak-track service">
                <span className="simulation-peak-track-label">Processing Throughput</span>
                <div className="simulation-peak-track-lane" />
                {Array.from({ length: servedPulses }).map((_, idx) => (
                  <span
                    key={`pk-out-${idx}`}
                    className="simulation-peak-token served"
                    style={{ animationDelay: `${(idx * 0.1) % 1.5}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="data-grid cards-3">
            <div className="data-card metric">
              <div className="metric-label">Peak Stress Value</div>
              <div className="metric-value">{Number(categoryMetrics?.peak_stress_value || 0).toFixed(2)}s</div>
            </div>
            <div className="data-card metric">
              <div className="metric-label">System Stress Level</div>
              <div className="metric-value">{String(categoryMetrics?.system_stress_level || 'moderate').toUpperCase()}</div>
            </div>
            <div className="data-card metric">
              <div className="metric-label">Demand Multiplier</div>
              <div className="metric-value">{Number(categoryMetrics?.demand_multiplier || 1).toFixed(1)}x</div>
            </div>
          </div>
          <div className="data-chart-grid peak">
            {peakSeries.map((hour, idx) => (
              <button
                key={`${hour.hour}-${idx}`}
                type="button"
                className={`data-chart-bar ${idx === playbackIndex ? 'active' : ''} stress-${hour.stress_level}`}
                title={`Hour ${hour.hour}: ${hour.avg_wait_time.toFixed(2)}s wait, ${hour.avg_arrivals.toFixed(0)} arrivals`}
              >
                <div className="data-chart-track">
                  <div className="data-chart-fill wait" style={{ height: `${safePercent((hour.avg_wait_time / Math.max(1, maxWait || 1)) * 100)}%` }} />
                  <div className="data-chart-fill demand" style={{ height: `${safePercent((hour.avg_arrivals / Math.max(1, maxArrivals || 1)) * 100)}%` }} />
                </div>
                <div className="data-chart-label">H{hour.hour}</div>
                <div className="data-chart-value">{hour.stress_level}</div>
              </button>
            ))}
          </div>
        </div>
      );
    }

    if (variant === 'shortage') {
      const normalScenario = scenarioComparison.normal || {};
      const roomScenario = scenarioComparison.room_shortage || {};
      const equipScenario = scenarioComparison.equipment_shortage || {};
      const combinedScenario = scenarioComparison.combined || {};
      const blockedDemand = Math.max(0, cappedQueue - cappedService);
      return (
        <div className="data-variant-panel shortage-panel">
          <div className="data-panel-header">
            <h3>Shortage Impact Comparison</h3>
            <span className="data-badge">Blocked demand focus</span>
          </div>
          <div className="simulation-map simulation-map-shortage">
            <div className="simulation-map-topline">
              <div className="simulation-map-title">Capacity Constraint Map</div>
              <div className="simulation-map-meta">Blocked demand: {blockedDemand}</div>
              <div className="simulation-map-meta">Room shortage wait: {Number(roomScenario.avg_waiting_time || 0).toFixed(2)}s</div>
              <div className="simulation-map-meta">Equipment shortage wait: {Number(equipScenario.avg_waiting_time || 0).toFixed(2)}s</div>
            </div>

            <div className="simulation-shortage-floor">
              <div className="simulation-shortage-lane in">
                <span className="simulation-shortage-label">Queued Demand</span>
                <div className="simulation-shortage-track" />
                {Array.from({ length: Math.max(8, Math.min(20, cappedQueue)) }).map((_, idx) => (
                  <span
                    key={`sh-in-${idx}`}
                    className="simulation-shortage-token demand"
                    style={{ animationDelay: `${(idx * 0.08) % 1.4}s` }}
                  />
                ))}
              </div>

              <div className="simulation-shortage-gates">
                {Array.from({ length: Math.max(3, Math.min(8, cappedService)) }).map((_, idx) => (
                  <span key={`gate-${idx}`} className="simulation-shortage-gate" />
                ))}
              </div>

              <div className="simulation-shortage-lane out">
                <span className="simulation-shortage-label">Completed Throughput</span>
                <div className="simulation-shortage-track" />
                {Array.from({ length: Math.max(4, Math.min(16, cappedService)) }).map((_, idx) => (
                  <span
                    key={`sh-out-${idx}`}
                    className="simulation-shortage-token served"
                    style={{ animationDelay: `${(idx * 0.11) % 1.7}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="data-grid cards-4">
            {[
              ['Normal', normalScenario],
              ['Room Shortage', roomScenario],
              ['Equipment Shortage', equipScenario],
              ['Combined', combinedScenario],
            ].map(([label, scenario]) => (
              <div key={label} className="data-card metric">
                <div className="metric-label">{label}</div>
                <div className="metric-value">{Number(scenario.avg_waiting_time || 0).toFixed(2)}s</div>
                <div className="metric-sub">Wait / queue {Number(scenario.avg_queue_length || 0).toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="data-impact-grid">
            {Object.entries(shortageImpact).map(([key, impact]) => (
              <div key={key} className="data-impact-card">
                <div className="data-impact-title">{key.replace(/_/g, ' ')}</div>
                <div className="data-impact-row">Wait increase: {Number(impact.wait_time_increase_pct || 0).toFixed(1)}%</div>
                <div className="data-impact-row">Queue increase: {Number(impact.queue_length_increase_pct || 0).toFixed(1)}%</div>
                <div className="data-impact-row">Unmet demand: {impact.unmet_demand ?? 0}</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (variant === 'what_if') {
      const activeScenario = scenarioComparisons.length
        ? scenarioComparisons[playbackIndex % scenarioComparisons.length]
        : null;

      return (
        <div className="data-variant-panel whatif-panel">
          <div className="data-panel-header">
            <h3>What-If Demand Scenarios</h3>
            <span className="data-badge">Best: {bestPerformer?.demand_label || 'N/A'}</span>
          </div>
          <div className="simulation-map simulation-map-whatif">
            <div className="simulation-map-topline">
              <div className="simulation-map-title">Scenario Comparison Map</div>
              <div className="simulation-map-meta">Active scenario: {activeScenario?.demand_label || 'N/A'}</div>
              <div className="simulation-map-meta">Active wait: {Number(activeScenario?.avg_wait_time || 0).toFixed(2)}s</div>
              <div className="simulation-map-meta">Active utilization: {safePercent((activeScenario?.utilization || 0) * 100)}%</div>
            </div>

            <div className="simulation-whatif-floor">
              <div className="simulation-whatif-column left">
                <div className="simulation-whatif-column-title">Scenario A</div>
                <div className="simulation-whatif-meter">
                  <span className="simulation-whatif-meter-fill" style={{ width: `${safePercent((bestPerformer?.utilization || 0) * 100)}%` }} />
                </div>
              </div>

              <div className="simulation-whatif-bridge">
                {Array.from({ length: Math.max(8, Math.min(20, cappedQueue)) }).map((_, idx) => (
                  <span
                    key={`wf-${idx}`}
                    className={`simulation-whatif-token lane-${idx % 2}`}
                    style={{ animationDelay: `${(idx * 0.1) % 1.4}s` }}
                  />
                ))}
              </div>

              <div className="simulation-whatif-column right">
                <div className="simulation-whatif-column-title">Scenario B</div>
                <div className="simulation-whatif-meter alt">
                  <span className="simulation-whatif-meter-fill" style={{ width: `${safePercent((worstPerformer?.utilization || 0) * 100)}%` }} />
                </div>
              </div>
            </div>
          </div>
          <div className="data-grid cards-3">
            <div className="data-card metric">
              <div className="metric-label">Best Performer</div>
              <div className="metric-value">{bestPerformer?.demand_label || 'N/A'}</div>
            </div>
            <div className="data-card metric">
              <div className="metric-label">Worst Performer</div>
              <div className="metric-value">{worstPerformer?.demand_label || 'N/A'}</div>
            </div>
            <div className="data-card metric">
              <div className="metric-label">Break-even Point</div>
              <div className="metric-value">{breakpointScenario?.demand_label || '> 150% demand'}</div>
            </div>
          </div>
          <div className="data-scenario-grid">
            {scenarioComparisons.map((scenario) => (
              <div key={scenario.multiplier} className="data-scenario-card">
                <div className="data-scenario-title">{scenario.demand_label}</div>
                <div className="data-scenario-row">Wait: {Number(scenario.avg_wait_time || 0).toFixed(2)}s</div>
                <div className="data-scenario-row">Queue: {Number(scenario.avg_queue_length || 0).toFixed(2)}</div>
                <div className="data-scenario-row">Utilization: {safePercent(scenario.utilization * 100)}%</div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="data-variant-panel default-panel">
        <div className="data-panel-header">
          <h3>Simulation Trend</h3>
          <span className="data-badge">{variant.replace(/_/g, ' ')}</span>
        </div>
        {renderTimelineStrip(timelineBars, playbackIndex)}
      </div>
    );
  };

  const renderRecommendationPanel = () => {
    if (!recommendations.length) {
      return null;
    }

    return (
      <div className="data-recommendation-panel">
        <div className="data-panel-header compact">
          <h4>Decision Support</h4>
          <span className="data-badge">Score {categoryDecisionSupport.health_score ?? 'N/A'}</span>
        </div>
        <div className="data-recommendation-list">
          {recommendations.slice(0, 3).map((rec, idx) => (
            <div key={idx} className={`data-recommendation severity-${rec.severity || 'good'}`}>
              <div className="rec-title">{rec.title || rec.scenario || 'Recommendation'}</div>
              <div className="rec-message">{rec.message || rec.finding}</div>
              <div className="rec-action">{rec.action}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderDataDrivenScene = () => (
    <div className="data-driven-stage">
      <div className="data-current-frame">
        <div className="data-frame-title">Current Frame</div>
        <div className="data-frame-row">
          <span>{currentFrame.period}</span>
          <span>{safePercent(currentFrame.utilization)}% utilization</span>
          <span>{throughputPerHour.toFixed(1)} jobs/hour</span>
          <span>{pressuredRooms} rooms under pressure</span>
        </div>
      </div>

      {renderVariantPanel()}
      {renderRecommendationPanel()}

      <div className="data-timeline-section">
        <div className="data-panel-header compact">
          <h4>Playback Timeline</h4>
          <span className="data-badge">Active: {activeTimelineBar?.period || 'N/A'}</span>
        </div>
        {renderTimelineStrip(timelineBars, playbackIndex)}
      </div>
    </div>
  );

  const renderRoomUsageScene = () => (
    <>
      <div className="flow-sim-map" role="img" aria-label="Animated room-based flow through intake, service, and room routing">
        <div className="flow-node node-entry">{labels.entry}</div>
        <div className="flow-node node-service">{labels.service}</div>
        <div className="flow-node node-exit">{labels.exit}</div>
        <div className="flow-route route-a" />
        <div className="flow-route route-b" />
        <div className="flow-branch-trunk" />

        {roomFlowBranches.map((branch) => (
          <React.Fragment key={`branch-${branch.roomId}`}>
            <div
              className="flow-route-room"
              style={{
                top: `${branch.targetY}%`,
                opacity: `${0.35 + Math.min(0.5, branch.loadPct / 200)}`,
              }}
            />
            <div
              className={`flow-room-node room-pressure-${branch.pressure}`}
              style={{ top: `${branch.targetY}%` }}
            >
              <span className="flow-room-name">{branch.roomName}</span>
              <span className="flow-room-load">{branch.loadPct}%</span>
            </div>
          </React.Fragment>
        ))}

        {flowAgents.intake.map((agent) => (
          <span
            key={agent.id}
            className={`flow-agent intake lane-${agent.lane}`}
            style={{
              animationDelay: `${agent.delay}s`,
              animationDuration: `${agent.duration}s`,
            }}
          />
        ))}

        {flowAgents.service.map((agent) => (
          <span
            key={agent.id}
            className={`flow-agent service lane-${agent.lane}`}
            style={{
              animationDelay: `${agent.delay}s`,
              animationDuration: `${agent.duration}s`,
            }}
          />
        ))}

        {branchAgents.map((agent) => (
          <span
            key={agent.id}
            className="flow-agent branch"
            style={{
              '--target-y': `${agent.targetY}%`,
              animationDelay: `${agent.delay}s`,
              animationDuration: `${agent.duration}s`,
              opacity: Math.max(0.58, Math.min(1, agent.loadPct / 100)),
            }}
          />
        ))}
      </div>

      <div className="cartoon-lanes">
        <div className="cartoon-lane">
          <h4>Intake Pulse</h4>
          <div className="agent-row">
            {Array.from({ length: cappedQueue }).map((_, idx) => (
              <span key={`q-${idx}`} className="agent-dot queue-dot" />
            ))}
          </div>
        </div>

        <div className="cartoon-lane">
          <h4>Service Lane</h4>
          <div className="agent-row">
            {Array.from({ length: cappedService }).map((_, idx) => (
              <span
                key={`s-${idx}`}
                className={`agent-dot serving-dot ${animationStateClass(currentFrame.utilization)}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="cartoon-room-strip">
        {topAnimatedRooms.map((room) => (
          <div key={room.roomId} className="cartoon-room">
            <div className="cartoon-room-title">{room.roomName}</div>
            <div className="cartoon-room-bar">
              <div
                className={`cartoon-room-fill ${animationStateClass(room.relativePressure || room.loadPct)}`}
                style={{ width: `${Math.max(2, Number(room.relativePressure || room.loadPct || 0))}%` }}
              />
            </div>
            <div className="cartoon-room-meta">{Number(room.relativePressure || 0).toFixed(1)}% relative</div>
          </div>
        ))}
      </div>
    </>
  );

  const renderEquipmentScene = () => (
    <div className="equipment-sim-board" role="img" aria-label="Equipment simulation showing queue buffering and workstation utilization">
      <div className="equipment-pod-grid">
        {topAnimatedRooms.slice(0, 4).map((room, idx) => {
          const load = Number(room.loadPct || room.relativePressure || 0);
          return (
            <div key={room.roomId || idx} className="equipment-pod">
              <div className="equipment-pod-name">{room.roomName || `Unit ${idx + 1}`}</div>
              <div className="equipment-dial">
                <div className="equipment-dial-track" />
                <div className="equipment-dial-value" style={{ transform: `rotate(${Math.min(180, load * 1.8)}deg)` }} />
                <div className="equipment-dial-label">{load.toFixed(0)}%</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="equipment-conveyor">
        <div className="equipment-conveyor-label">Buffered Requests</div>
        <div className="equipment-token-row">
          {Array.from({ length: cappedQueue }).map((_, idx) => (
            <span
              key={`eq-q-${idx}`}
              className="equipment-token queued"
              style={{ animationDelay: `${(idx * 0.08) % 1.2}s` }}
            />
          ))}
        </div>
      </div>

      <div className="equipment-service-rack">
        <div className="equipment-conveyor-label">Active Equipment Slots</div>
        <div className="equipment-token-row service">
          {Array.from({ length: cappedService }).map((_, idx) => (
            <span
              key={`eq-s-${idx}`}
              className={`equipment-token serving ${animationStateClass(currentFrame.utilization)}`}
              style={{ animationDelay: `${(idx * 0.12) % 1.6}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );

  const renderPeakHourScene = () => (
    <div className="peak-hour-stage" role="img" aria-label="Peak hour surge simulation with load spikes across time bands">
      <div className="peak-wave-grid">
        {Array.from({ length: 12 }).map((_, idx) => {
          const wave = Math.max(12, Math.min(100, currentFrame.utilization + (idx % 4) * 9 - 15));
          const isHot = wave > 75;
          return (
            <div key={`pk-${idx}`} className={`peak-wave-col ${isHot ? 'hot' : ''}`}>
              <div className="peak-wave-bar" style={{ height: `${wave}%` }} />
              <span className="peak-wave-label">T{idx + 1}</span>
            </div>
          );
        })}
      </div>
      <div className="peak-surge-lanes">
        <div className="surge-track in">
          {Array.from({ length: cappedQueue }).map((_, idx) => (
            <span key={`ps-in-${idx}`} className="surge-pulse in" style={{ animationDelay: `${(idx * 0.07) % 1.2}s` }} />
          ))}
        </div>
        <div className="surge-track out">
          {Array.from({ length: cappedService }).map((_, idx) => (
            <span key={`ps-out-${idx}`} className="surge-pulse out" style={{ animationDelay: `${(idx * 0.1) % 1.4}s` }} />
          ))}
        </div>
      </div>
    </div>
  );

  const renderShortageScene = () => {
    const blocked = Math.max(0, cappedQueue - cappedService);
    return (
      <div className="shortage-stage" role="img" aria-label="Shortage simulation showing constrained gates and blocked demand">
        <div className="shortage-demand-lane">
          {Array.from({ length: cappedQueue }).map((_, idx) => (
            <span key={`sh-in-${idx}`} className="shortage-dot demand" style={{ animationDelay: `${(idx * 0.09) % 1.2}s` }} />
          ))}
        </div>
        <div className="shortage-gates">
          {Array.from({ length: Math.max(3, cappedService) }).map((_, idx) => (
            <span key={`gate-${idx}`} className="shortage-gate" />
          ))}
        </div>
        <div className="shortage-output-lane">
          {Array.from({ length: cappedService }).map((_, idx) => (
            <span key={`sh-out-${idx}`} className="shortage-dot served" style={{ animationDelay: `${(idx * 0.12) % 1.8}s` }} />
          ))}
        </div>
        <div className="shortage-blocked-counter">Blocked demand: {blocked}</div>
      </div>
    );
  };

  const renderWhatIfScene = () => (
    <div className="whatif-stage" role="img" aria-label="What-if simulation with parallel scenarios and crossing outcomes">
      <div className="whatif-column left">
        <h4>Scenario A</h4>
        <div className="whatif-meter">
          <div className="whatif-meter-fill" style={{ width: `${Math.min(100, Math.max(8, currentFrame.utilization - 12))}%` }} />
        </div>
      </div>
      <div className="whatif-bridge">
        {Array.from({ length: Math.max(8, Math.min(20, cappedQueue)) }).map((_, idx) => (
          <span key={`wf-${idx}`} className={`whatif-agent lane-${idx % 2}`} style={{ animationDelay: `${(idx * 0.1) % 1.4}s` }} />
        ))}
      </div>
      <div className="whatif-column right">
        <h4>Scenario B</h4>
        <div className="whatif-meter alt">
          <div className="whatif-meter-fill" style={{ width: `${Math.min(100, Math.max(8, currentFrame.utilization + 6))}%` }} />
        </div>
      </div>
    </div>
  );

  const renderDistinctScene = () => {
    if (variant === 'equipment_usage') {
      return renderEquipmentScene();
    }
    if (variant === 'peak_hour') {
      return renderPeakHourScene();
    }
    if (variant === 'shortage') {
      return renderShortageScene();
    }
    if (variant === 'what_if') {
      return renderWhatIfScene();
    }
    return renderRoomUsageScene();
  };

  const renderWhimsicalWorld = () => (
    <div className={`toon-world-stage toon-world-${variant}`} role="img" aria-label="Whimsical cartoon world with expressive humans and animated objects interacting together">
      <div className="toon-world-title">{worldPreset.title}</div>
      <div className="toon-backdrop">
        <span className="cloud c1" />
        <span className="cloud c2" />
        <span className="cloud c3" />
      </div>

      <div className="toon-street">
        <span className="street-mark m1" />
        <span className="street-mark m2" />
        <span className="street-mark m3" />
      </div>

      <div className="toon-cast humans">
        {worldPreset.humans.map((human, idx) => (
          <div
            key={human.id}
            className={`toon-human ${human.outfit} expr-${human.expression}`}
            style={{ animationDelay: `${idx * 0.2}s` }}
          >
            <div className="toon-head">
              <span className="eye left" />
              <span className="eye right" />
              <span className="mouth" />
            </div>
            <div className="toon-body" />
            <div className="toon-feet">
              <span />
              <span />
            </div>
            <div className="toon-name">{human.name}</div>
            <div className="toon-trait">{human.trait}</div>
          </div>
        ))}
      </div>

      <div className="toon-cast objects">
        {worldPreset.objects.map((obj, idx) => (
          <div
            key={obj.id}
            className={`toon-object ${obj.role}`}
            style={{ animationDelay: `${idx * 0.18}s` }}
          >
            <div className="obj-face">
              <span className="eye left" />
              <span className="eye right" />
              <span className="mouth" />
            </div>
            <div className="obj-legs">
              <span />
              <span />
            </div>
            <div className="obj-label">{obj.label}</div>
          </div>
        ))}
      </div>

      <div className="toon-interactions">
        <div className="speech human">{worldPreset.humanLine}</div>
        <div className="speech object">{worldPreset.objectLine}</div>
      </div>

      <div className="toon-energy-bar">
        <span>{worldPreset.energyLabel}</span>
        <div className="energy-track">
          <div className={`energy-fill mood-${mood}`} style={{ width: `${Math.min(100, Math.max(15, currentFrame.utilization))}%` }} />
        </div>
        <span className="energy-label">{mood.toUpperCase()}</span>
      </div>
    </div>
  );

  return (
    <div className={`card simulation-playback simulation-playback-${variant}`}>
      <div className="card-header">
        <h2>Simulation Playback</h2>
        <div className="cartoon-controls">
          <button
            className="btn-export"
            onClick={() => setIsPlaybackActive((prev) => !prev)}
            type="button"
          >
            {isPlaybackActive ? <FiPause /> : <FiPlay />} {isPlaybackActive ? 'Pause' : 'Play'}
          </button>
          <select
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
            className="cartoon-speed-select"
          >
            <option value={0.75}>0.75x</option>
            <option value={1}>1x</option>
            <option value={1.5}>1.5x</option>
            <option value={2}>2x</option>
          </select>
        </div>
      </div>

      <div className="cartoon-stage">
        {renderDataDrivenScene()}
      </div>
    </div>
  );
};

export default SimulationPlaybackCard;
