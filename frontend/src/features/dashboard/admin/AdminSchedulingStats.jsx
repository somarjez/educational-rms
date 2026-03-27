import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiClock, FiHome, FiWatch, FiList, FiCalendar, FiAlertTriangle } from 'react-icons/fi';
import SchedulingStatCard from './Stats/SchedulingStatCard';
import styles from './styles/AdminSchedulingStats.module.css';

const AdminSchedulingStats = ({ schedulingStats, onBookingUpdate, userRole }) => {
  const navigate = useNavigate();
  const pendingRequests = schedulingStats?.pending_requests || [];
  const normalizedRole = userRole?.toUpperCase?.() || '';
  const isAdminOnly = normalizedRole === 'ADMIN';

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
        <SchedulingStatCard
          icon={<FiClock size={32} color="#f59e0b" />}
          value={schedulingStats.pending_approvals}
          label="Pending Approvals"
          className="pending"
        />
        <SchedulingStatCard
          icon={<FiHome size={32} color="#3b82f6" />}
          value={schedulingStats.total_rooms}
          label="Active Rooms"
        />
        <SchedulingStatCard
          icon={<FiWatch size={32} color="#8b5cf6" />}
          value={schedulingStats.active_time_slots}
          label="Time Slots"
        />
        <SchedulingStatCard
          icon={<FiList size={32} color="#06b6d4" />}
          value={schedulingStats.waitlist_entries}
          label="Waitlist Entries"
        />
        <SchedulingStatCard
          icon={<FiCalendar size={32} color="#10b981" />}
          value={schedulingStats.upcoming_bookings}
          label="Upcoming (7 Days)"
        />
        <SchedulingStatCard
          icon={<FiAlertTriangle size={32} color="#ef4444" />}
          value={schedulingStats.conflicts_today}
          label="Conflicts Today"
          className="warning"
        />
      </div>

      {/* Pending Requests with Quick Actions */}
      {isAdminOnly && pendingRequests && pendingRequests.length > 0 && (
        <div className={styles.pendingRequestsSection}>
          <div className={styles.pendingOverviewHeader}>
            <h3 className={styles.subsectionTitle}>Pending Approval Requests</h3>
            <button
              className={styles.reviewRequestsBtn}
              onClick={() => navigate('/approval-requests')}
            >
              Review Requests
            </button>
          </div>

          <div className={styles.pendingOverviewCard}>
            <p className={styles.pendingOverviewText}>
              You currently have <strong>{schedulingStats.pending_approvals || pendingRequests.length}</strong> request(s) waiting for approval review.
            </p>
            <ul className={styles.pendingPreviewList}>
              {pendingRequests.slice(0, 3).map((request) => (
                <li key={request.id} className={styles.pendingPreviewItem}>
                  <span className={styles.pendingPreviewPrimary}>{request.user_name} - {request.room_name}</span>
                  <span className={styles.pendingPreviewSecondary}>{request.date}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSchedulingStats;
