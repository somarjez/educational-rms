import { useMemo } from 'react';

const useSimulationDerivedData = ({
  snapshot,
  simData,
  simulationParams,
  historyRuns,
  historyPage,
  auditLogs,
  auditLogsPage,
  equipmentPage,
}) => {
  const rooms = snapshot?.rooms || [];
  const equipment = snapshot?.equipment || [];
  const metrics = simData?.result?.metrics || {};

  const HISTORY_PAGE_SIZE = 5;
  const totalHistoryPages = Math.max(1, Math.ceil(historyRuns.length / HISTORY_PAGE_SIZE));
  const currentHistoryPage = Math.min(historyPage, totalHistoryPages);
  const paginatedHistoryRuns = historyRuns.slice(
    (currentHistoryPage - 1) * HISTORY_PAGE_SIZE,
    currentHistoryPage * HISTORY_PAGE_SIZE
  );

  const AUDIT_LOGS_PAGE_SIZE = 5;
  const totalAuditLogsPages = Math.max(1, Math.ceil(auditLogs.length / AUDIT_LOGS_PAGE_SIZE));
  const currentAuditLogsPage = Math.min(auditLogsPage, totalAuditLogsPages);
  const paginatedAuditLogs = auditLogs.slice(
    (currentAuditLogsPage - 1) * AUDIT_LOGS_PAGE_SIZE,
    currentAuditLogsPage * AUDIT_LOGS_PAGE_SIZE
  );

  const actualVsSimulated = useMemo(() => {
    const totalActualBookings = (snapshot?.booking_summary || []).reduce(
      (sum, item) => sum + Number(item.total_bookings || 0),
      0
    );
    const totalActualHours = (snapshot?.booking_summary || []).reduce(
      (sum, item) => sum + Number(item.total_hours || 0),
      0
    );
    const roomCount = Math.max(1, Number(snapshot?.rooms?.length || 1));
    const lookbackDays = Math.max(1, Number(simulationParams.lookbackDays || 14));
    const simHours = Math.max(1, Number(simulationParams.simulationHours || 8));
    const observedHours = lookbackDays * simHours;

    const actualThroughputPerHour = totalActualBookings / observedHours;
    const simulatedThroughputPerHour = Number(metrics.served_count_avg || metrics.served_count || 0) / simHours;

    const actualLoadPct = (totalActualHours / Math.max(1, roomCount * observedHours)) * 100;
    const simulatedLoadPct = simData?.roomLoad?.length
      ? simData.roomLoad.reduce((sum, room) => sum + Number(room.loadPct || 0), 0) / simData.roomLoad.length
      : 0;

    const actualServiceTime = totalActualBookings > 0 ? totalActualHours / totalActualBookings : 0;
    const simulatedSystemTime = Number(metrics.avg_system_time || 0);

    return {
      actualThroughputPerHour,
      simulatedThroughputPerHour,
      throughputDeltaPct: actualThroughputPerHour > 0
        ? ((simulatedThroughputPerHour - actualThroughputPerHour) / actualThroughputPerHour) * 100
        : 0,
      actualLoadPct,
      simulatedLoadPct,
      loadDeltaPct: actualLoadPct > 0
        ? ((simulatedLoadPct - actualLoadPct) / actualLoadPct) * 100
        : 0,
      actualServiceTime,
      simulatedSystemTime,
      timeDeltaPct: actualServiceTime > 0
        ? ((simulatedSystemTime - actualServiceTime) / actualServiceTime) * 100
        : 0,
    };
  }, [snapshot, simulationParams.lookbackDays, simulationParams.simulationHours, metrics, simData]);

  const equipmentSaturationLevels = useMemo(() => {
    if (!snapshot?.equipment?.length) {
      return [];
    }

    const lookbackDays = Math.max(1, Number(simulationParams.lookbackDays || 14));
    const simHours = Math.max(1, Number(simulationParams.simulationHours || 8));
    const summaryMap = new Map(
      (snapshot?.booking_summary || []).map((item) => [item.room_id, item])
    );
    const roomLoadMap = new Map(
      (simData?.roomLoad || []).map((item) => [item.roomId, item])
    );

    return (snapshot.equipment || []).map((eq) => {
      const relatedRooms = (snapshot.rooms || []).filter((room) =>
        (room.equipment || []).some((roomEq) => roomEq.id === eq.id)
      );

      const actualBookingsForEquipment = relatedRooms.reduce((sum, room) => {
        const roomSummary = summaryMap.get(room.id);
        return sum + Number(roomSummary?.total_bookings || 0);
      }, 0);

      const simulatedBookingsForEquipment = relatedRooms.reduce((sum, room) => {
        const roomProjection = roomLoadMap.get(room.id);
        return sum + Number(roomProjection?.projectedBookings || 0);
      }, 0);

      const units = Math.max(1, Number(eq.quantity || 1));
      const actualHourlyDemand = actualBookingsForEquipment / Math.max(1, lookbackDays * simHours);
      const simulatedHourlyDemand = simulatedBookingsForEquipment / simHours;

      const actualSaturation = Math.min(200, (actualHourlyDemand / units) * 100);
      const simulatedSaturation = Math.min(200, (simulatedHourlyDemand / units) * 100);

      let status = 'Low';
      if (simulatedSaturation >= 100) {
        status = 'Critical';
      } else if (simulatedSaturation >= 75) {
        status = 'High';
      } else if (simulatedSaturation >= 40) {
        status = 'Moderate';
      }

      return {
        id: eq.id,
        name: eq.name,
        units,
        actualSaturation,
        simulatedSaturation,
        status,
      };
    }).sort((a, b) => b.simulatedSaturation - a.simulatedSaturation);
  }, [snapshot, simData, simulationParams.lookbackDays, simulationParams.simulationHours]);

  const EQUIPMENT_PAGE_SIZE = 5;
  const totalEquipmentPages = Math.max(1, Math.ceil(equipmentSaturationLevels.length / EQUIPMENT_PAGE_SIZE));
  const currentEquipmentPage = Math.min(equipmentPage, totalEquipmentPages);
  const paginatedEquipmentLevels = equipmentSaturationLevels.slice(
    (currentEquipmentPage - 1) * EQUIPMENT_PAGE_SIZE,
    currentEquipmentPage * EQUIPMENT_PAGE_SIZE
  );

  return {
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
  };
};

export default useSimulationDerivedData;
