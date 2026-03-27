import React from 'react';
import { useNavigate } from 'react-router-dom';
import ActivityItem from './RecentActivity/ActivityItem';
import EmptyState from './RecentActivity/EmptyState';
import styles from './styles/RecentActivity.module.css';

const RecentActivity = ({ bookings, userRole }) => {
  const navigate = useNavigate();

  const getStatusClass = (status) => {
    const statusMap = {
      CONFIRMED: 'completed',
      PENDING: 'pending',
      CANCELLED: 'cancelled',
      COMPLETED: 'completed'
    };
    return statusMap[status] || 'pending';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const handleViewAll = () => {
    const normalizedRole = userRole?.toUpperCase?.() || '';
    const isAdminLike = normalizedRole === 'ADMIN' || normalizedRole === 'FACULTY';
    navigate(isAdminLike ? '/bookings' : '/student/bookings');
  };

  return (
    <div className={styles.sectionCard}>
      <div className={styles.sectionHeader}>
        <h2 className={styles.sectionTitle}>Recent Activity</h2>
        <button className={styles.viewAllBtn} onClick={handleViewAll}>View All</button>
      </div>
      <div className={styles.activityList}>
        {bookings.length > 0 ? (
          bookings.map((booking) => (
            <ActivityItem
              key={booking.id}
              booking={booking}
              getStatusClass={getStatusClass}
              formatDate={formatDate}
              styles={styles}
            />
          ))
        ) : (
          <EmptyState styles={styles} />
        )}
      </div>
    </div>
  );
};

export default RecentActivity;
