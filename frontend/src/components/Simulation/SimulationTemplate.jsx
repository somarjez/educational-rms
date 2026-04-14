import React, { useState, useEffect } from 'react';
import {
  FiRefreshCw,
  FiBarChart2,
  FiAlertTriangle,
} from 'react-icons/fi';
import '../Modeling/styles/ModelingModule.css';
import './styles/SimulationTemplate.css';
import {
  ActualVsSimulatedTable,
  AuditBackupSection,
  EquipmentSection,
  HistorySection,
  RoomLoadMap,
  SimulationInsightsCard,
  SimulationParametersForm,
  SimulationPlaybackCard,
  SimulationProcessChart,
  SimulationSummaryCards,
} from './components';
import {
  useSimulationActions,
  useSimulationCache,
  useSimulationDerivedData,
  useSimulationPlayback,
} from './hooks';
import {
  RoomUsageVisualization,
  EquipmentUsageVisualization,
  PeakHourVisualization,
  ShortageComparison,
  WhatIfMatrix,
  SimulationComparison,
} from './categories';
import { INITIAL_SIMULATION_PARAMS } from './constants/simulationDefaults';
import {
  animationStateClass,
  getAdjustedArrivalRate,
  getRelativePressureClass,
  getTimelineBarClass,
} from './utils/simulationTemplateUtils';

const SimulationTemplate = ({ title, description, simulationType }) => {
  const [snapshot, setSnapshot] = useState(null);
  const { simData, setSimData } = useSimulationCache(simulationType);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [isAuditLoading, setIsAuditLoading] = useState(false);
  const [isBackupLoading, setIsBackupLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState('');
  const [historyRuns, setHistoryRuns] = useState([]);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [auditLogsPage, setAuditLogsPage] = useState(1);
  const [equipmentPage, setEquipmentPage] = useState(1);
  const [simulationParams, setSimulationParams] = useState(INITIAL_SIMULATION_PARAMS);

  const adjustedArrivalRate = getAdjustedArrivalRate(simulationParams, simulationType);

  const {
    loadAuditLogs,
    loadSimulationHistory,
    loadSystemSnapshot,
    runSimulation,
    exportResults,
    downloadBackup,
    exportHistoryRun,
    loadHistoryRun,
  } = useSimulationActions({
    title,
    simulationType,
    snapshot,
    simulationParams,
    setSnapshot,
    setSimulationParams,
    setSimData,
    setError,
    setActionMessage,
    setIsLoading,
    setIsRunning,
    setAuditLogs,
    setAuditLogsPage,
    setIsAuditLoading,
    setHistoryRuns,
    setHistoryPage,
    setHistoryLoading,
    setEquipmentPage,
    setIsBackupLoading,
    simData,
  });

  useEffect(() => {
    loadSystemSnapshot();
    loadAuditLogs();
    loadSimulationHistory();
  }, [simulationType]);

  const handleParamChange = (key, value) => {
    setSimulationParams(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const {
    rooms,
    equipment,
    metrics,
    totalHistoryPages,
    currentHistoryPage,
    paginatedHistoryRuns,
    totalAuditLogsPages,
    currentAuditLogsPage,
    paginatedAuditLogs,
    actualVsSimulated,
    totalEquipmentPages,
    currentEquipmentPage,
    paginatedEquipmentLevels,
  } = useSimulationDerivedData({
    snapshot,
    simData,
    simulationParams,
    historyRuns,
    historyPage,
    auditLogs,
    auditLogsPage,
    equipmentPage,
  });

  const normalizedSimulationType = String(simulationType || 'general').replace(/-/g, '_');

  const {
    playbackIndex,
    isPlaybackActive,
    setIsPlaybackActive,
    playbackSpeed,
    setPlaybackSpeed,
    currentFrame,
    queueAgents,
    servingAgents,
    topAnimatedRooms,
    pressuredRooms,
    throughputPerHour,
    roomFlowBranches,
    branchAgents,
    flowAgents,
    timelineBars,
  } = useSimulationPlayback({
    simData,
    simulationParams,
    metrics,
    simulationType: normalizedSimulationType,
    onSimulationDataChanged: () => setEquipmentPage(1),
  });

  const categoryMetrics = simData?.result?.category_metrics || null;

  const renderCategoryVisualization = () => {
    if (!simData?.result || !categoryMetrics) {
      return null;
    }

    const commonProps = {
      result: simData.result,
      categoryMetrics,
    };

    switch (normalizedSimulationType) {
      case 'room_usage':
        return <RoomUsageVisualization {...commonProps} />;
      case 'equipment_usage':
        return <EquipmentUsageVisualization {...commonProps} />;
      case 'peak_hour':
        return <PeakHourVisualization {...commonProps} />;
      case 'shortage':
        return <ShortageComparison {...commonProps} />;
      case 'what_if':
        return <WhatIfMatrix {...commonProps} />;
      default:
        return null;
    }
  };

  const comparisonResults = [
    ...(simData?.result
      ? [
        {
          id: simData.result.id,
          simulation_type: normalizedSimulationType,
          metrics: simData.result.metrics || {},
        },
      ]
      : []),
    ...historyRuns
      .slice(0, 4)
      .map((run) => ({
        id: run.id,
        simulation_type:
          String(run?.parameters?.simulation_type || simulationType || 'general').replace(/-/g, '_'),
        metrics: run.metrics || {},
      }))
      .filter((run) => run.id !== simData?.result?.id),
  ];

  return (
    <div className="modeling-container">
      <div className="modeling-header">
        <div className="header-content">
          <h1>
            <FiBarChart2 /> {title}
          </h1>
          <p>{description}</p>
        </div>
        <button className="btn-refresh" onClick={loadSystemSnapshot} disabled={isLoading || isRunning}>
          <FiRefreshCw /> {isLoading ? 'Refreshing...' : 'Refresh Snapshot'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {actionMessage && <div className="card simulation-action-message">{actionMessage}</div>}

      {!rooms.length && !isLoading && (
        <div className="card simulation-warning">
          <FiAlertTriangle />
          <div>
            <h3>No active rooms found</h3>
            <p>
              Add rooms in scheduling first. Once rooms are present, this page will render room-level
              simulation visualization automatically.
            </p>
          </div>
        </div>
      )}

      <SimulationParametersForm
        simulationParams={simulationParams}
        rooms={rooms}
        equipment={equipment}
        onParamChange={handleParamChange}
        onRunSimulation={runSimulation}
        isRunning={isRunning}
        isLoading={isLoading}
      />

      <HistorySection
        historyLoading={historyLoading}
        onRefresh={loadSimulationHistory}
        runs={paginatedHistoryRuns}
        currentPage={currentHistoryPage}
        totalPages={totalHistoryPages}
        onPrev={() => setHistoryPage((prev) => Math.max(1, prev - 1))}
        onNext={() => setHistoryPage((prev) => Math.min(totalHistoryPages, prev + 1))}
        onLoadRun={loadHistoryRun}
        onExportRun={exportHistoryRun}
      />

      <AuditBackupSection
        isAuditLoading={isAuditLoading}
        isBackupLoading={isBackupLoading}
        onRefreshLogs={loadAuditLogs}
        onBackupSummary={() => downloadBackup(false)}
        onBackupFull={() => downloadBackup(true)}
        logs={paginatedAuditLogs}
        currentPage={currentAuditLogsPage}
        totalPages={totalAuditLogsPages}
        onPrev={() => setAuditLogsPage((prev) => Math.max(1, prev - 1))}
        onNext={() => setAuditLogsPage((prev) => Math.min(totalAuditLogsPages, prev + 1))}
      />

      {simData && (
        <div className="modeling-content">
          <SimulationSummaryCards
            metrics={metrics}
            throughputPerHour={throughputPerHour}
            pressuredRooms={pressuredRooms}
          />

          <ActualVsSimulatedTable actualVsSimulated={actualVsSimulated} />

          <EquipmentSection
            levels={paginatedEquipmentLevels}
            currentPage={currentEquipmentPage}
            totalPages={totalEquipmentPages}
            onPrev={() => setEquipmentPage((prev) => Math.max(1, prev - 1))}
            onNext={() => setEquipmentPage((prev) => Math.min(totalEquipmentPages, prev + 1))}
          />

          <SimulationPlaybackCard
            simulationType={normalizedSimulationType}
            categoryMetrics={categoryMetrics}
            currentFrame={currentFrame}
            playbackIndex={playbackIndex}
            timelineBars={timelineBars}
            throughputPerHour={throughputPerHour}
            pressuredRooms={pressuredRooms}
            isPlaybackActive={isPlaybackActive}
            setIsPlaybackActive={setIsPlaybackActive}
            playbackSpeed={playbackSpeed}
            setPlaybackSpeed={setPlaybackSpeed}
            roomFlowBranches={roomFlowBranches}
            flowAgents={flowAgents}
            branchAgents={branchAgents}
            queueAgents={queueAgents}
            servingAgents={servingAgents}
            topAnimatedRooms={topAnimatedRooms}
            animationStateClass={animationStateClass}
          />

          <RoomLoadMap
            roomLoad={simData.roomLoad || []}
            getRelativePressureClass={getRelativePressureClass}
          />

          <SimulationProcessChart
            timelineBars={timelineBars}
            playbackIndex={playbackIndex}
            throughputPerHour={throughputPerHour}
            currentFrame={currentFrame}
            getTimelineBarClass={getTimelineBarClass}
            onExport={exportResults}
          />

          <SimulationInsightsCard
            adjustedArrivalRate={adjustedArrivalRate}
            throughputPerHour={throughputPerHour}
            simulationHours={simulationParams.simulationHours}
            pressuredRooms={pressuredRooms}
            replications={metrics.num_replications || simulationParams.iterations}
          />

          {renderCategoryVisualization()}

          {comparisonResults.length > 1 && (
            <SimulationComparison
              simulationResults={comparisonResults}
              selectedMetric="avg_waiting_time"
            />
          )}
        </div>
      )}
    </div>
  );
};

export default SimulationTemplate;

