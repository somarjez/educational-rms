import { useEffect, useMemo, useRef, useState } from 'react';

const DEFAULT_VARIANT = 'room_usage';

const normalizeVariant = (simulationType) => {
  const normalized = String(simulationType || DEFAULT_VARIANT).replace(/-/g, '_');
  return normalized || DEFAULT_VARIANT;
};

const useSimulationPlayback = ({ simData, simulationParams, metrics, simulationType, onSimulationDataChanged }) => {
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaybackActive, setIsPlaybackActive] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const animationVariant = normalizeVariant(simulationType);
  const onSimulationDataChangedRef = useRef(onSimulationDataChanged);

  const timeline = simData?.timeline || [];
  const timelineLength = timeline.length;
  const timelineSignature = useMemo(() => {
    if (!timelineLength) {
      return 'empty';
    }
    const first = timeline[0];
    const last = timeline[timelineLength - 1];
    return [
      timelineLength,
      String(first?.period || ''),
      Number(first?.utilization || 0),
      String(last?.period || ''),
      Number(last?.utilization || 0),
    ].join('|');
  }, [timeline, timelineLength]);

  useEffect(() => {
    onSimulationDataChangedRef.current = onSimulationDataChanged;
  }, [onSimulationDataChanged]);

  useEffect(() => {
    if (!timelineLength) {
      return;
    }
    setPlaybackIndex(0);
    setIsPlaybackActive(true);
    if (typeof onSimulationDataChangedRef.current === 'function') {
      onSimulationDataChangedRef.current();
    }
  }, [timelineSignature, timelineLength]);

  useEffect(() => {
    if (!isPlaybackActive || !timelineLength) {
      return;
    }

    const intervalMs = Math.max(220, 900 / playbackSpeed);
    const timer = setInterval(() => {
      setPlaybackIndex((prev) => {
        if (prev >= timelineLength - 1) {
          return 0;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaybackActive, playbackSpeed, timelineLength]);

  const currentFrame = timeline[playbackIndex] || null;
  const isPeakHourMode = animationVariant === 'peak_hour';
  const isShortageMode = animationVariant === 'shortage';
  const isEquipmentMode = animationVariant === 'equipment_usage';
  const isWhatIfMode = animationVariant === 'what_if';

  const queueAgents = Math.max(
    2,
    Math.min(
      isPeakHourMode ? 20 : 16,
      Math.round(
        ((currentFrame?.utilization || 0) / (isShortageMode ? 8.5 : 10))
          + Number(simulationParams.demandMultiplier || 1) * (isPeakHourMode ? 2.4 : 1.5)
      )
    )
  );
  const servingAgents = Math.max(
    1,
    Math.min(
      isShortageMode ? 8 : 14,
      Math.round((currentFrame?.utilization || 0) / (isShortageMode ? 11 : 8.5))
    )
  );
  const topAnimatedRooms = (simData?.roomLoad || []).slice(0, 8);
  const pressuredRooms = (simData?.roomLoad || []).filter((room) => room.loadPct >= 75).length;
  const throughputPerHour = Number(metrics.served_count_avg || 0) / Math.max(1, Number(simulationParams.simulationHours || 1));

  const roomFlowBranches = useMemo(() => {
    if (isEquipmentMode || isWhatIfMode) {
      return [];
    }

    const branchRooms = topAnimatedRooms.slice(0, 4);
    if (!branchRooms.length) {
      return [];
    }

    const anchors = [20, 38, 62, 80];
    const totalLoad = branchRooms.reduce((sum, room) => sum + Math.max(1, Number(room.loadPct || 0)), 0);
    const dispatchTotal = Math.max(
      5,
      Math.min(
        isPeakHourMode ? 34 : 26,
        Math.round(((currentFrame?.utilization || 0) / (isPeakHourMode ? 4.4 : 5.2)) + branchRooms.length * 2)
      )
    );

    return branchRooms.map((room, idx) => {
      const weight = Math.max(1, Number(room.loadPct || 0)) / Math.max(1, totalLoad);
      const roomDispatch = Math.max(1, Math.round(dispatchTotal * weight * (isShortageMode ? 0.75 : 1)));
      return {
        roomId: room.roomId,
        roomName: room.roomName,
        loadPct: room.loadPct,
        pressure: room.pressure,
        targetY: anchors[idx] || Math.min(84, 20 + idx * 16),
        agentCount: roomDispatch,
      };
    });
  }, [topAnimatedRooms, currentFrame, isEquipmentMode, isWhatIfMode, isPeakHourMode, isShortageMode]);

  const branchAgents = useMemo(() => {
    return roomFlowBranches.flatMap((branch, branchIdx) => {
      return Array.from({ length: branch.agentCount }).map((_, idx) => ({
        id: `br-${branch.roomId}-${idx}`,
        targetY: branch.targetY,
        loadPct: branch.loadPct,
        delay: ((idx * 0.17) + (branchIdx * 0.31)) % 2.8,
        duration: Math.max(
          isShortageMode ? 2.2 : 1.4,
          (isPeakHourMode ? 2.6 : 3.25) - (currentFrame?.utilization || 0) / 130 + (100 - branch.loadPct) / 260
        ),
      }));
    });
  }, [roomFlowBranches, currentFrame, isPeakHourMode, isShortageMode]);

  const flowAgents = useMemo(() => {
    if (!currentFrame) {
      return { intake: [], service: [] };
    }

    const laneCount = isWhatIfMode ? 4 : 3;
    const intakeCount = Math.max(
      6,
      Math.min(
        isPeakHourMode ? 34 : 28,
        Math.round(
          (currentFrame.utilization / (isPeakHourMode ? 4.1 : 4.8))
            + Number(simulationParams.demandMultiplier || 1) * (isWhatIfMode ? 1.4 : 2)
        )
      )
    );
    const serviceCount = Math.max(
      isShortageMode ? 3 : 4,
      Math.min(isShortageMode ? 10 : 20, Math.round(currentFrame.utilization / (isShortageMode ? 8 : 6)))
    );

    const intake = Array.from({ length: intakeCount }).map((_, idx) => {
      const lane = idx % laneCount;
      return {
        id: `in-${idx}`,
        lane,
        delay: (idx * (isPeakHourMode ? 0.17 : 0.23)) % 2.8,
        duration: Math.max(
          isShortageMode ? 2.4 : 1.45,
          (isWhatIfMode ? 3.2 : 3.9) - (currentFrame.utilization / 100) * 1.35 + lane * 0.2
        ),
      };
    });

    const service = Array.from({ length: serviceCount }).map((_, idx) => {
      const lane = idx % laneCount;
      return {
        id: `sv-${idx}`,
        lane,
        delay: (idx * (isShortageMode ? 0.24 : 0.18)) % 2.2,
        duration: Math.max(
          isShortageMode ? 2.1 : 1.35,
          (isPeakHourMode ? 2.6 : 3.1) - (currentFrame.utilization / 100) * 1.1 + lane * 0.18
        ),
      };
    });

    return { intake, service };
  }, [
    currentFrame,
    simulationParams.demandMultiplier,
    isPeakHourMode,
    isShortageMode,
    isWhatIfMode,
  ]);

  const timelineBars = useMemo(() => {
    const rows = simData?.timeline || [];
    return rows.map((row) => {
      const utilization = Number(row?.utilization || 0);
      return {
        period: row.period,
        utilization,
        normalized: Math.min(100, Math.max(5, utilization)),
      };
    });
  }, [simData]);

  return {
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
    animationVariant,
  };
};

export default useSimulationPlayback;
