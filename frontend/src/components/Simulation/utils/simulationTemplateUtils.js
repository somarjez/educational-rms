export const toErrorMessage = (error, fallback) => {
  const responseData = error?.response?.data;
  if (!responseData) {
    return error?.message || fallback;
  }
  if (typeof responseData === 'string') {
    return responseData;
  }
  if (responseData.error) {
    return responseData.error;
  }
  if (responseData.detail) {
    return responseData.detail;
  }
  if (typeof responseData === 'object') {
    return Object.entries(responseData)
      .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
      .join(' | ');
  }
  return fallback;
};

export const getAdjustedArrivalRate = (simulationParams, simulationType) => {
  const baseArrival = Number(simulationParams.arrivalRate || 1.0);
  const multiplier = Number(simulationParams.demandMultiplier || 1.0);

  if (simulationType === 'peak-hour') {
    return baseArrival * 1.7;
  }
  if (simulationType === 'shortage') {
    return baseArrival * 1.15;
  }
  if (simulationType === 'what-if') {
    return baseArrival * multiplier;
  }

  return baseArrival * multiplier;
};

export const resolveNumServers = ({ snapshot, simulationParams, simulationType }) => {
  const roomCount = Number(snapshot?.rooms?.length || 1);
  let servers = Number(simulationParams.numServers || roomCount || 1);

  if (simulationParams.selectedRoomId) {
    servers = 1;
  }

  if (simulationType === 'equipment-usage' && simulationParams.selectedEquipmentId) {
    const eq = (snapshot?.equipment || []).find(
      (item) => String(item.id) === String(simulationParams.selectedEquipmentId)
    );
    if (eq) {
      servers = Math.max(1, Number(eq.quantity || 1));
    }
  }

  if (simulationType === 'shortage') {
    servers = Math.max(1, Math.floor(servers * 0.65));
  }

  return Math.max(1, Math.floor(servers));
};

export const buildRoomVisualization = ({ snapshot, metrics, params }) => {
  const rooms = snapshot?.rooms || [];
  if (!rooms.length) {
    return [];
  }

  const summaryMap = new Map(
    (snapshot?.booking_summary || []).map((item) => [item.room_id, item])
  );

  const totalHistoricalBookings = (snapshot?.booking_summary || []).reduce(
    (sum, item) => sum + Number(item.total_bookings || 0),
    0
  );
  const totalProjectedArrivals = Number(params.arrival_rate || 0) * Number(params.simulation_hours || 0);

  const baseRows = rooms.map((room) => {
    const historical = summaryMap.get(room.id);
    const historicalBookings = Number(historical?.total_bookings || 0);
    const demandShare = totalHistoricalBookings > 0
      ? historicalBookings / totalHistoricalBookings
      : 1 / rooms.length;
    const projectedBookings = totalProjectedArrivals * demandShare;
    const slotCapacity = Number(params.simulation_hours || 1);
    const loadPct = Math.min(100, (projectedBookings / Math.max(slotCapacity, 1)) * 100);

    return {
      roomId: room.id,
      roomName: room.name,
      roomCapacity: room.capacity,
      historicalBookings,
      projectedBookings: Number(projectedBookings.toFixed(2)),
      loadPct: Number(loadPct.toFixed(1)),
      utilization: Number(((metrics.server_utilization || 0) * 100).toFixed(1)),
    };
  });

  const maxLoad = baseRows.reduce((max, row) => Math.max(max, row.loadPct), 0);

  return baseRows.map((row) => {
    const relativePressure = maxLoad > 0 ? (row.loadPct / maxLoad) * 100 : 0;
    let pressure = 'low';

    if (row.loadPct >= 85) {
      pressure = 'critical';
    } else if (row.loadPct >= 65 || relativePressure >= 90) {
      pressure = 'high';
    } else if (row.loadPct >= 35 || relativePressure >= 70) {
      pressure = 'moderate';
    }

    return {
      ...row,
      pressure,
      relativePressure: Number(relativePressure.toFixed(1)),
    };
  });
};

export const buildTimelineRows = (result) => {
  const timeSlotBreakdown = result?.metrics?.time_slot_breakdown || [];
  if (Array.isArray(timeSlotBreakdown) && timeSlotBreakdown.length) {
    const baseUtil = Number((result?.metrics?.server_utilization || 0) * 100);
    return timeSlotBreakdown.map((slot, idx) => {
      const avgQueue = Number(slot?.avg_max_queue ?? slot?.max_queue_length ?? 0);
      const avgWait = Number(slot?.avg_wait_time ?? slot?.wait_time ?? 0);
      const pressureBoost = Math.min(40, avgQueue * 6 + avgWait * 24);
      const utilization = Math.min(100, Math.max(5, baseUtil * 0.7 + pressureBoost));
      const rawHour = Number(slot?.hour);
      const hour = Number.isFinite(rawHour) ? rawHour : idx;
      return {
        period: `Hour ${hour + 1}`,
        utilization: Number(utilization.toFixed(1)),
      };
    });
  }

  const replications = result?.raw_data?.replications || [];
  if (replications.length) {
    const targetPoints = Math.min(24, replications.length);
    const step = targetPoints > 1
      ? (replications.length - 1) / (targetPoints - 1)
      : 0;
    const rows = [];

    for (let i = 0; i < targetPoints; i += 1) {
      const sourceIndex = Math.round(i * step);
      const row = replications[Math.min(sourceIndex, replications.length - 1)] || {};
      rows.push({
        period: `Rep ${sourceIndex + 1}`,
        utilization: Number(((row.server_utilization || 0) * 100).toFixed(1)),
      });
    }

    return rows;
  }

  const util = Number((result?.metrics?.server_utilization || 0) * 100);
  return Array.from({ length: 12 }).map((_, idx) => {
    const factor = 0.85 + ((idx % 4) * 0.1);
    return {
      period: `Step ${idx + 1}`,
      utilization: Number(Math.min(100, util * factor).toFixed(1)),
    };
  });
};

export const getTimelineBarClass = (value) => {
  if (value > 75) {
    return 'sim-process-bar-critical';
  }
  if (value > 40) {
    return 'sim-process-bar-moderate';
  }
  return 'sim-process-bar-low';
};

export const getRelativePressureClass = (relativePressure) => {
  if (relativePressure > 90) {
    return 'progress-fill-critical';
  }
  if (relativePressure > 70) {
    return 'progress-fill-moderate';
  }
  return 'progress-fill-low';
};

export const animationStateClass = (util) => {
  if (util >= 80) {
    return 'anim-state-critical';
  }
  if (util >= 55) {
    return 'anim-state-busy';
  }
  return 'anim-state-calm';
};

export const downloadJsonFile = ({ data, fileName }) => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
};
