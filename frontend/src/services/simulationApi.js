import api from './api';

export const listSimulationScenarios = async () => {
  const response = await api.get('/simulation/');
  return response.data;
};

export const createSimulationScenario = async (data) => {
  const response = await api.post('/simulation/', data);
  return response.data;
};

export const runSimulationScenario = async (id, data = {}) => {
  const response = await api.post(`/simulation/${id}/run/`, data);
  return response.data;
};

export const runSimulationBatchCompare = async ({ scenarioId, multipliers, numReplications }) => {
  const payload = {
    scenario_id: scenarioId,
  };

  if (Array.isArray(multipliers) && multipliers.length) {
    payload.multipliers = multipliers;
  }

  if (Number.isFinite(Number(numReplications))) {
    payload.num_replications = Number(numReplications);
  }

  try {
    const response = await api.post('/simulation/batch_compare/', payload);
    return response.data;
  } catch (error) {
    const fallbackResponse = await api.post('/simulation/batch-compare/', payload);
    return fallbackResponse.data;
  }
};

export const getSimulationResults = async (id) => {
  const response = await api.get(`/simulation/${id}/results/`);
  return response.data;
};

export const getSimulationTimeSlotBreakdown = async (scenarioId, resultId) => {
  const params = {};
  if (resultId) {
    params.result_id = resultId;
  }
  const response = await api.get(`/simulation/${scenarioId}/time-slot-breakdown/`, { params });
  return response.data;
};

export const getSimulationShortageBreakdown = async (scenarioId, resultId) => {
  const params = {};
  if (resultId) {
    params.result_id = resultId;
  }
  const response = await api.get(`/simulation/${scenarioId}/shortage-breakdown/`, { params });
  return response.data;
};

export const getSimulationRecommendations = async (scenarioId, resultId) => {
  const params = {};
  if (resultId) {
    params.result_id = resultId;
  }
  const response = await api.get(`/simulation/${scenarioId}/recommendations/`, { params });
  return response.data;
};

export const getSimulationAuditLogs = async (limit = 100, options = {}) => {
  const params = { limit };
  if (options.simulationType) {
    params.simulation_type = options.simulationType;
  }
  const response = await api.get('/simulation/audit_logs/', {
    params,
  });
  return response.data;
};

export const getSimulationHistory = async (limit = 50, options = {}) => {
  const params = { limit };
  if (options.simulationType) {
    params.simulation_type = options.simulationType;
  }
  const response = await api.get('/simulation/history/', {
    params,
  });
  return response.data;
};

export const getSimulationBackup = async (includeRaw = false, auditLimit = 5, options = {}) => {
  const params = {
    include_raw: includeRaw ? 1 : 0,
    audit_limit: auditLimit,
  };
  if (options.simulationType) {
    params.simulation_type = options.simulationType;
  }
  const response = await api.get('/simulation/backup/', {
    params,
  });
  return response.data;
};
export const getSimulationSystemSnapshot = async (startDate, endDate) => {
  const params = {};
  if (startDate && endDate) {
    params.start_date = startDate;
    params.end_date = endDate;
  }
  const response = await api.get('/simulation/system_snapshot/', { params });
  return response.data;
};

export const getCurrentUtilization = async (date) => {
  const params = {};
  if (date) {
    params.date = date;
  }
  const response = await api.get('/capacity/current_utilization/', { params });
  return response.data;
};

export const getPeakHours = async (days = 14) => {
  const response = await api.get('/capacity/peak_hours/', { params: { days } });
  return response.data;
};

export const getConflictSummary = async (days = 120) => {
  const response = await api.get('/capacity/conflict_summary/', { params: { days } });
  return response.data;
};

export const getDecisionSupport = async ({ date, peakDays = 14, conflictDays = 120 } = {}) => {
  const params = {};
  if (date) {
    params.date = date;
  }
  params.peak_days = peakDays;
  params.conflict_days = conflictDays;

  const response = await api.get('/capacity/decision_support/', { params });
  return response.data;
};
