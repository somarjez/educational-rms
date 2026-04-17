import React from 'react';
import { useNavigate } from 'react-router-dom';
import SchedulingStatCard from './Stats/SchedulingStatCard';
import PendingRequestsList from './Requests/PendingRequestsList';
import usePendingRequests from '../../../hooks/booking/usePendingRequests';
import { SCHEDULING_STAT_CONFIGS } from './constants/schedulingStatConfigs';
import styles from './styles/AdminSchedulingStats.module.css';

const AdminSchedulingStats = ({ schedulingStats, onBookingUpdate }) => {
  const navigate = useNavigate();
  const {
    pendingRequests,
    handleBookingApproved,
    handleBookingRejected
  } = usePendingRequests(schedulingStats?.pending_requests || [], onBookingUpdate);

  if (!schedulingStats) return null;

  return (
    <div className={styles.adminSchedulingSection}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Scheduling Management</h2>
        <button 
          className={styles.viewAllBtn}
          onClick={() => navigate('/admin-scheduling')}
        >
          Manage All
        </button>
      </div>

      {/* Scheduling Stats Cards */}
      <div className={styles.schedulingStatsGrid}>
        {SCHEDULING_STAT_CONFIGS.map((card) => {
          const Icon = card.Icon;
          return (
            <SchedulingStatCard
              key={card.key}
              icon={<Icon size={card.iconSize} color={card.iconColor} />}
              value={schedulingStats?.[card.valueKey] ?? 0}
              label={card.label}
              className={card.className || ''}
            />
          );
        })}
      </div>

      {/* Pending Requests with Quick Actions */}
      {pendingRequests && pendingRequests.length > 0 && (
        <div className={styles.pendingRequestsSection}>
          <h3 className={styles.subsectionTitle}>Pending Approval Requests</h3>
          <PendingRequestsList
            requests={pendingRequests}
            onApproved={handleBookingApproved}
            onRejected={handleBookingRejected}
          />
        </div>
      )}
    </div>
  );
};

export default AdminSchedulingStats;
