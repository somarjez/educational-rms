import {
  createSimulationScenario,
  getSimulationAuditLogs,
  getSimulationBackup,
  getSimulationHistory,
  getSimulationRecommendations,
  getSimulationShortageBreakdown,
  getSimulationSystemSnapshot,
  getSimulationTimeSlotBreakdown,
  runSimulationBatchCompare,
  runSimulationScenario,
} from '../../../services/simulationApi';
import {
  buildRoomVisualization,
  buildTimelineRows,
  downloadJsonFile,
  getAdjustedArrivalRate,
  resolveNumServers,
  toErrorMessage,
} from '../utils/simulationTemplateUtils';

const useSimulationActions = ({
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
}) => {
  const loadAuditLogs = async () => {
    setIsAuditLoading(true);
    try {
      const logs = await getSimulationAuditLogs(80, {
        simulationType,
      });
      setAuditLogs(Array.isArray(logs) ? logs : []);
      setAuditLogsPage(1);
    } catch (auditError) {
      setError(toErrorMessage(auditError, 'Failed to load audit logs.'));
    } finally {
      setIsAuditLoading(false);
    }
  };

  const loadSimulationHistory = async () => {
    setHistoryLoading(true);
    try {
      const runs = await getSimulationHistory(10, {
        simulationType,
      });
      setHistoryRuns(Array.isArray(runs) ? runs : []);
      setHistoryPage(1);
      setEquipmentPage(1);
    } catch (historyError) {
      console.error('Failed to load simulation history:', historyError);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadSystemSnapshot = async () => {
    setIsLoading(true);
    setError('');

    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - Number(simulationParams.lookbackDays || 14));

      let response = await getSimulationSystemSnapshot(
        startDate.toISOString().slice(0, 10),
        endDate.toISOString().slice(0, 10)
      );

      const windowBookings = (response.booking_summary || []).reduce(
        (sum, item) => sum + Number(item.total_bookings || 0),
        0
      );

      if (windowBookings === 0) {
        response = await getSimulationSystemSnapshot();
      }

      setSnapshot(response);

      const totalBookings = (response.booking_summary || []).reduce(
        (sum, item) => sum + Number(item.total_bookings || 0),
        0
      );
      const lookbackDays = Number(simulationParams.lookbackDays || 14);
      const simHours = Number(simulationParams.simulationHours || 8);

      const estimatedArrival = totalBookings > 0
        ? totalBookings / Math.max(1, lookbackDays * simHours)
        : Math.max(0.4, Number(response.rooms?.length || 1) / 10);

      setSimulationParams((prev) => ({
        ...prev,
        arrivalRate: Number(estimatedArrival.toFixed(3)),
      }));
      setActionMessage('System snapshot loaded successfully.');
    } catch (error) {
      const msg = toErrorMessage(error, 'Failed to load system snapshot.');
      setError(msg);
      console.error('Error loading system snapshot:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const normalizeSimulationType = (value) => String(value || 'general').replace(/-/g, '_');

  const buildScenarioPayload = (typeOverride) => {
    const normalizedSimulationType = normalizeSimulationType(typeOverride || simulationType);
    const adjustedArrivalRate = getAdjustedArrivalRate(simulationParams, simulationType);
    const numServers = resolveNumServers({
      snapshot,
      simulationParams,
      simulationType,
    });

    const payload = {
      name: `${title} ${new Date().toISOString()}`,
      description: `Auto-generated ${normalizedSimulationType} scenario from real system snapshot.`,
      num_replications: Number(simulationParams.iterations || 400),
      parameters: {
        arrival_model: 'poisson',
        arrival_rate: Number(adjustedArrivalRate.toFixed(4)),
        service_distribution: simulationParams.serviceDistribution,
        service_rate: Number(simulationParams.serviceRate),
        service_time: Number(simulationParams.serviceTime),
        num_servers: numServers,
        simulation_hours: Number(simulationParams.simulationHours || 8),
        prng: simulationParams.prng,
        seed: simulationParams.seed === '' ? null : Number(simulationParams.seed),
        room_id: simulationParams.selectedRoomId ? Number(simulationParams.selectedRoomId) : null,
        equipment_id: simulationParams.selectedEquipmentId ? Number(simulationParams.selectedEquipmentId) : null,
        simulation_type: normalizedSimulationType,
      },
    };

    if (payload.parameters.service_distribution === 'fixed') {
      payload.parameters.service_rate = null;
    }

    return payload;
  };

  const fetchTimeSlotData = async (scenarioId, resultId) => {
    return getSimulationTimeSlotBreakdown(scenarioId, resultId);
  };

  const fetchShortageComparison = async (scenarioId, resultId) => {
    return getSimulationShortageBreakdown(scenarioId, resultId);
  };

  const fetchRecommendations = async (scenarioId, resultId) => {
    return getSimulationRecommendations(scenarioId, resultId);
  };

  const setAnimationMode = (category) => {
    const animationMode = normalizeSimulationType(category || simulationType);
    setSimData((prev) => {
      if (!prev) {
        return prev;
      }
      return {
        ...prev,
        animationMode,
      };
    });
    return animationMode;
  };

  const enrichResultWithPhaseFiveData = async ({ scenarioId, result, simulationType: activeType }) => {
    const normalizedType = normalizeSimulationType(activeType);
    const categoryMetrics = {
      ...(result?.category_metrics || {}),
    };

    try {
      if (['room_usage', 'equipment_usage', 'peak_hour'].includes(normalizedType)) {
        const timeSlotPayload = await fetchTimeSlotData(scenarioId, result?.id);
        if (Array.isArray(timeSlotPayload?.time_slots)) {
          categoryMetrics.time_slot_breakdown = timeSlotPayload.time_slots;
        }
      }
    } catch (error) {
      console.warn('Unable to fetch time-slot breakdown:', error);
    }

    try {
      if (normalizedType === 'shortage') {
        const shortagePayload = await fetchShortageComparison(scenarioId, result?.id);
        if (shortagePayload?.scenario_comparison) {
          categoryMetrics.scenario_comparison = shortagePayload.scenario_comparison;
        }
        if (shortagePayload?.shortage_impact) {
          categoryMetrics.shortage_impact = shortagePayload.shortage_impact;
        }
        if (Array.isArray(shortagePayload?.recommendations) && shortagePayload.recommendations.length) {
          categoryMetrics.recommendations = shortagePayload.recommendations;
        }
      }
    } catch (error) {
      console.warn('Unable to fetch shortage breakdown:', error);
    }

    try {
      const recPayload = await fetchRecommendations(scenarioId, result?.id);
      if (Array.isArray(recPayload?.recommendations) && recPayload.recommendations.length) {
        categoryMetrics.recommendations = recPayload.recommendations;
      }
      categoryMetrics.decision_support = {
        ...(categoryMetrics.decision_support || {}),
        health_score: recPayload?.health_score ?? categoryMetrics?.decision_support?.health_score,
        priority: recPayload?.priority ?? categoryMetrics?.decision_support?.priority,
        recommendations: recPayload?.recommendations || categoryMetrics?.recommendations || [],
      };
    } catch (error) {
      console.warn('Unable to fetch recommendations:', error);
    }

    return {
      ...result,
      category_metrics: categoryMetrics,
    };
  };

  const runSimulation = async () => {
    setError('');
    setActionMessage('');
    setIsRunning(true);

    try {
      const normalizedSimulationType = normalizeSimulationType(simulationType);
      const payload = buildScenarioPayload(normalizedSimulationType);

      const createdScenario = await createSimulationScenario(payload);
      const rawResult = await runSimulationScenario(createdScenario.id, {
        mode: 'simulate',
        num_replications: Number(simulationParams.iterations || 400),
      });
      const result = await enrichResultWithPhaseFiveData({
        scenarioId: createdScenario.id,
        result: rawResult,
        simulationType: normalizedSimulationType,
      });

      const timeline = buildTimelineRows(result);
      const roomLoad = buildRoomVisualization({
        snapshot,
        metrics: result.metrics || {},
        params: payload.parameters,
      });

      setSimData({
        scenario: createdScenario,
        result,
        timeline,
        roomLoad,
      });
      setActionMessage('Simulation completed successfully.');
      await loadAuditLogs();
      setEquipmentPage(1);
      await loadSimulationHistory();
    } catch (error) {
      const msg = toErrorMessage(error, 'Simulation run failed. Please review your parameters.');
      setError(msg);
      console.error('Simulation run error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const runBatchComparison = async (parameterRanges = {}) => {
    setError('');
    setActionMessage('');
    setIsRunning(true);

    try {
      const multipliers = Array.isArray(parameterRanges?.multipliers) && parameterRanges.multipliers.length
        ? parameterRanges.multipliers.map((value) => Number(value)).filter((value) => Number.isFinite(value))
        : [0.75, 1.0, 1.25];
      const numReplications = Number(parameterRanges?.numReplications || simulationParams.iterations || 300);

      let scenarioId = Number(parameterRanges?.scenarioId || simData?.scenario?.id || 0);
      if (!scenarioId) {
        const whatIfPayload = buildScenarioPayload('what_if');
        const createdScenario = await createSimulationScenario(whatIfPayload);
        scenarioId = createdScenario.id;
      }

      const batchResult = await runSimulationBatchCompare({
        scenarioId,
        multipliers,
        numReplications,
      });

      setActionMessage(`Batch comparison complete: ${multipliers.length} scenarios analyzed.`);
      await loadAuditLogs();
      await loadSimulationHistory();
      return batchResult;
    } catch (error) {
      const msg = toErrorMessage(error, 'Batch comparison failed.');
      setError(msg);
      throw error;
    } finally {
      setIsRunning(false);
    }
  };

  const exportResults = () => {
    if (!simData) {
      return;
    }
    downloadJsonFile({
      data: simData,
      fileName: `simulation-${simulationType}-${Date.now()}.json`,
    });
    setActionMessage('Current simulation results exported successfully.');
  };

  const downloadBackup = async (includeRaw = false) => {
    setIsBackupLoading(true);
    setError('');
    try {
      const backup = await getSimulationBackup(includeRaw, 5, {
        simulationType,
      });
      downloadJsonFile({
        data: backup,
        fileName: `simulation-backup-${Date.now()}.json`,
      });
      setActionMessage(`Backup exported (${includeRaw ? 'with raw data' : 'summary only'}).`);
      await loadAuditLogs();
    } catch (backupError) {
      setError(toErrorMessage(backupError, 'Failed to export backup.'));
    } finally {
      setIsBackupLoading(false);
    }
  };

  const exportHistoryRun = (run) => {
    const payload = {
      scenario: {
        id: run.scenario,
        name: run.scenario_name,
        description: run.scenario_description,
        created_at: run.scenario_created_at,
        parameters: run.parameters,
      },
      run: {
        id: run.id,
        run_date: run.run_date,
        metrics: run.metrics,
        raw_data: run.raw_data,
      },
    };

    downloadJsonFile({
      data: payload,
      fileName: `simulation-run-${run.id}.json`,
    });
  };

  const loadHistoryRun = (run) => {
    const result = {
      id: run.id,
      scenario: run.scenario,
      run_date: run.run_date,
      metrics: run.metrics || {},
      category_metrics: run.category_metrics || {},
      raw_data: run.raw_data || {},
    };

    const timeline = buildTimelineRows(result);
    const roomLoad = buildRoomVisualization({
      snapshot,
      metrics: result.metrics || {},
      params: run.parameters || {},
    });

    setSimData({
      scenario: {
        id: run.scenario,
        name: run.scenario_name,
        description: run.scenario_description,
        created_at: run.scenario_created_at,
        parameters: run.parameters || {},
      },
      result,
      timeline,
      roomLoad,
    });
    setEquipmentPage(1);
  };

  return {
    loadAuditLogs,
    loadSimulationHistory,
    loadSystemSnapshot,
    runSimulation,
    runBatchComparison,
    fetchTimeSlotData,
    fetchShortageComparison,
    fetchRecommendations,
    setAnimationMode,
    exportResults,
    downloadBackup,
    exportHistoryRun,
    loadHistoryRun,
  };
};

export default useSimulationActions;
