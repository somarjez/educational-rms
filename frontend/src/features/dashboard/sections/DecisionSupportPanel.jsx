import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiRefreshCw, FiLayers, FiPackage, FiMapPin } from 'react-icons/fi';
import {
  getConflictSummary,
  getCurrentUtilization,
  getPeakHours,
  getDecisionSupport,
} from '../../../services/simulationApi';
import styles from './styles/DecisionSupportPanel.module.css';

const normalizeRole = (role) => String(role || '').toUpperCase();

const formatPercent = (value) => {
  const numericValue = Number(value || 0);
  if (Number.isNaN(numericValue)) {
    return '0%';
  }
  return `${numericValue.toFixed(1)}%`;
};

const parseConflictRate = (value) => {
  const numericValue = Number.parseFloat(String(value || '').replace('%', ''));
  return Number.isNaN(numericValue) ? 0 : numericValue;
};

const getLocalDateString = () => {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const recommendationIcons = {
  'room-allocation': FiMapPin,
  'schedule-improvements': FiClock,
  bottlenecks: FiLayers,
  equipment: FiPackage,
};

const buildRecommendations = (currentUtilization, peakHours, conflictSummary) => {
  const roomUtilization = Array.isArray(currentUtilization?.room_utilization)
    ? [...currentUtilization.room_utilization]
    : [];
  const equipmentUsage = Array.isArray(currentUtilization?.equipment_usage)
    ? [...currentUtilization.equipment_usage]
    : [];

  roomUtilization.sort((left, right) => Number(left.utilization_pct || 0) - Number(right.utilization_pct || 0));
  equipmentUsage.sort((left, right) => Number(right.assignment_pct || 0) - Number(left.assignment_pct || 0));

  const bestRoom = roomUtilization[0];
  const peakSlot = Array.isArray(peakHours?.peak_slots) ? peakHours.peak_slots[0] : null;
  const lowSlot = Array.isArray(peakHours?.underutilized_slots) ? peakHours.underutilized_slots[0] : null;
  const conflictRate = parseConflictRate(conflictSummary?.summary?.conflict_rate);
  const mostConflictedResource = conflictSummary?.summary?.most_conflicted_resource || 'N/A';
  const overloadedEquipment = equipmentUsage.find((item) => {
    const assignmentPct = Number(item.assignment_pct || 0);
    const availableQuantity = Number(item.available_quantity ?? 0);
    return assignmentPct >= 80 && availableQuantity <= 1;
  });

  return [
    {
      id: 'room-allocation',
      title: 'Recommend optimal room allocation',
      tone: bestRoom ? 'good' : 'neutral',
      headline: bestRoom
        ? bestRoom.utilization_pct <= 35
          ? `Use ${bestRoom.room_name} for flexible bookings.`
          : `Prefer ${bestRoom.room_name} for lower-priority sessions.`
        : 'No room utilization data available yet.',
      details: bestRoom
        ? `${bestRoom.room_name} is currently the least utilized room at ${formatPercent(bestRoom.utilization_pct)} with ${bestRoom.booked_slots}/${bestRoom.total_slots} booked slots.`
        : 'The current utilization endpoint did not return room-level data.',
    },
    {
      id: 'schedule-improvements',
      title: 'Suggest scheduling improvements',
      tone: peakSlot ? 'watch' : 'neutral',
      headline: peakSlot
        ? `Move non-urgent bookings away from ${peakSlot.time_slot}.`
        : 'No peak slot concentration detected.',
      details: peakSlot
        ? lowSlot
          ? `Peak demand is concentrated in ${peakSlot.time_slot}, while ${lowSlot.time_slot} remains underused. Stagger approvals toward quieter slots.`
          : `Peak demand is concentrated in ${peakSlot.time_slot}.`
        : 'Peak-hour data is not available right now.',
    },
    {
      id: 'bottlenecks',
      title: 'Identify resource bottlenecks',
      tone: conflictRate >= 10 ? 'alert' : 'watch',
      headline: conflictRate >= 10
        ? `Resource bottlenecks are elevated at ${conflictSummary?.summary?.conflict_rate || '0%'} conflict rate.`
        : 'No major bottleneck is currently visible.',
      details: conflictSummary?.summary
        ? `${mostConflictedResource} is the most conflicted resource. ${Number(conflictSummary.summary.high_risk_slots || 0)} high-risk slots are flagged.`
        : 'Conflict summary data is not available right now.',
    },
    {
      id: 'equipment',
      title: 'Recommend additional equipment',
      tone: overloadedEquipment ? 'alert' : 'good',
      headline: overloadedEquipment
        ? `Add more ${overloadedEquipment.equipment_name} units.`
        : 'No immediate equipment additions are needed.',
      details: overloadedEquipment
        ? `${overloadedEquipment.equipment_name} is at ${formatPercent(overloadedEquipment.assignment_pct)} assignment with only ${overloadedEquipment.available_quantity} spare unit(s) left.`
        : equipmentUsage.length > 0
          ? 'Current equipment allocation leaves enough spare capacity across the active inventory.'
          : 'Equipment utilization data is not available right now.',
    },
  ];
};

const DecisionSupportPanel = ({ userRole, showViewDetails = false }) => {
  const role = normalizeRole(userRole);
  const isSupportedRole = role === 'ADMIN' || role === 'FACULTY';
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');

    try {
      const today = getLocalDateString();
      const payload = await getDecisionSupport({
        date: today,
        peakDays: 14,
        conflictDays: 120,
      });
      if (Array.isArray(payload?.recommendations) && payload.recommendations.length > 0) {
        setRecommendations(payload.recommendations);
      } else {
        const [currentUtilization, peakHours, conflictSummary] = await Promise.all([
          getCurrentUtilization(today),
          getPeakHours(14),
          getConflictSummary(120),
        ]);
        setRecommendations(buildRecommendations(currentUtilization, peakHours, conflictSummary));
      }
    } catch (err) {
      try {
        const today = getLocalDateString();
        const [currentUtilization, peakHours, conflictSummary] = await Promise.all([
          getCurrentUtilization(today),
          getPeakHours(14),
          getConflictSummary(120),
        ]);
        setRecommendations(buildRecommendations(currentUtilization, peakHours, conflictSummary));
      } catch (fallbackErr) {
        setError('Failed to load decision support insights.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isSupportedRole) {
      setLoading(false);
      return;
    }

    loadData();
  }, [isSupportedRole]);

  const cards = useMemo(
    () => recommendations.map((item) => ({
      ...item,
      icon: recommendationIcons[item.id] || FiLayers,
    })),
    [recommendations]
  );

  if (!isSupportedRole) {
    return null;
  }

  return (
    <section className={styles.decisionSupportPanel}>
      <div className={styles.header}>
        <div>
          <h3 className={styles.title}>Decision Support</h3>
          <p className={styles.subtitle}>
            Live recommendations based on utilization, conflicts, and peak demand.
          </p>
        </div>

        <div className={styles.headerActions}>
          {showViewDetails ? (
            <button
              type="button"
              className={`${styles.refreshButton} ${styles.viewDetailsButton}`}
              onClick={() => navigate('/modeling/resource-utilization')}
            >
              View Details
            </button>
          ) : null}

          <button type="button" className={styles.refreshButton} onClick={loadData} disabled={loading}>
            <FiRefreshCw className={loading ? styles.spinning : ''} />
            {loading ? 'Refreshing' : 'Refresh'}
          </button>
        </div>
      </div>

      {error ? <div className={styles.errorBanner}>{error}</div> : null}

      <div className={styles.recommendationGrid}>
        {cards.map((item) => {
          const Icon = item.icon;

          return (
            <article key={item.id} className={`${styles.recommendationCard} ${styles[item.tone] || ''}`}>
              <div className={styles.cardHeader}>
                <div className={styles.iconShell}>
                  <Icon />
                </div>
                <span className={styles.cardTag}>{item.title}</span>
              </div>
              <h4 className={styles.cardHeadline}>{item.headline}</h4>
              <p className={styles.cardDetails}>{item.details}</p>
            </article>
          );
        })}
      </div>

      {loading ? <div className={styles.loadingState}>Loading recommendations...</div> : null}
    </section>
  );
};

export default DecisionSupportPanel;