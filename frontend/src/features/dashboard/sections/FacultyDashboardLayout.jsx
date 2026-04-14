import React from 'react';
import { FiUsers, FiTrendingUp, FiCalendar, FiAlertCircle } from 'react-icons/fi';
import styles from './styles/FacultyDashboardLayout.module.css';

const FacultyDashboardLayout = ({ schedulingStats = {} }) => {
  const {
    total_bookings = 0,
    confirmed_bookings = 0,
    pending_bookings = 0,
    scheduled_for_today = 0,
  } = schedulingStats || {};

  const summaryCards = [
    {
      id: 'total-bookings',
      title: 'Total Bookings',
      value: total_bookings,
      icon: <FiCalendar className={styles.cardIcon} />,
      color: 'primary',
      trend: '+' + (total_bookings > 0 ? Math.floor(total_bookings * 0.1) : 0) + ' this week',
    },
    {
      id: 'confirmed',
      title: 'Confirmed',
      value: confirmed_bookings,
      icon: <FiUsers className={styles.cardIcon} />,
      color: 'success',
      trend: total_bookings > 0 ? Math.round((confirmed_bookings / total_bookings) * 100) + '%' : '0%',
    },
    {
      id: 'pending',
      title: 'Pending Bookings',
      value: pending_bookings,
      icon: <FiAlertCircle className={styles.cardIcon} />,
      color: 'warning',
      trend: pending_bookings > 0 ? 'Awaiting update' : 'No pending items',
    },
    {
      id: 'today',
      title: "Today's Schedule",
      value: scheduled_for_today,
      icon: <FiTrendingUp className={styles.cardIcon} />,
      color: 'info',
      trend: scheduled_for_today > 0 ? scheduled_for_today + ' sessions' : 'No sessions',
    },
  ];

  const getCardColorClass = (color) => {
    switch (color) {
      case 'success':
        return styles.cardSuccess;
      case 'warning':
        return styles.cardWarning;
      case 'info':
        return styles.cardInfo;
      case 'primary':
      default:
        return styles.cardPrimary;
    }
  };

  return (
    <div className={styles.facultyDashboardLayout}>
      <div className={styles.layoutHeader}>
        <h3 className={styles.layoutTitle}>Resource Overview</h3>
        <p className={styles.layoutSubtitle}>Quick summary of your scheduling activity</p>
      </div>

      <div className={styles.summaryGrid}>
        {summaryCards.map((card) => (
          <div key={card.id} className={`${styles.summaryCard} ${getCardColorClass(card.color)}`}>
            <div className={styles.cardHeader}>
              <div className={styles.iconContainer}>
                {card.icon}
              </div>
              <div className={styles.cardTitleSection}>
                <h4 className={styles.cardTitle}>{card.title}</h4>
              </div>
            </div>
            <div className={styles.cardContent}>
              <div className={styles.cardValue}>{card.value}</div>
              <div className={styles.cardTrend}>{card.trend}</div>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.resourceStatusSection}>
        <h4 className={styles.sectionTitle}>Resource Usage Overview</h4>
        <div className={styles.usageInfo}>
          <p className={styles.usageText}>
            Monitor your resource bookings and availability across all scheduled sessions.
          </p>
          <div className={styles.usageMetrics}>
            <div className={styles.metric}>
              <span className={styles.metricLabel}>Utilization Rate</span>
              <div className={styles.metricBar}>
                <div
                  className={styles.metricFill}
                  style={{ width: `${(confirmed_bookings / Math.max(total_bookings, 1)) * 100}%` }}
                ></div>
              </div>
              <span className={styles.metricValue}>
                {total_bookings > 0 ? Math.round((confirmed_bookings / total_bookings) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FacultyDashboardLayout;
