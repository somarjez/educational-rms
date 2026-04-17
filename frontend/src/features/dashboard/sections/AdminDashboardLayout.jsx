import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  HiOutlineHandRaised,
} from 'react-icons/hi2';
import styles from './styles/AdminDashboardLayout.module.css';
import {
  DashboardCalendarIcon,
  DashboardClockIcon,
  DashboardHouseIcon,
} from '../icons/DashboardIcons';

const AdminDashboardLayout = ({ bookingStats = {}, schedulingStats = {} }) => {
  const navigate = useNavigate();
  const {
    total_bookings = 0,
    pending_bookings = 0,
  } = bookingStats || {};

  const {
    total_rooms = 0,
    upcoming_bookings = 0,
  } = schedulingStats || {};

  const pendingRequestsCount = Number(pending_bookings || 0);

  const systemCards = [
    {
      id: 'total-rooms',
      title: 'Active Rooms',
      value: total_rooms,
      icon: <DashboardHouseIcon className={styles.iconSvg} />,
      color: 'primary',
      description: 'resources managed',
    },
    {
      id: 'total-bookings',
      title: 'System Bookings',
      value: total_bookings,
      icon: <DashboardCalendarIcon className={styles.iconSvg} />,
      color: 'info',
      description: 'total reservation',
    },
    {
      id: 'pending-actions',
      title: 'Pending Request',
      value: pendingRequestsCount,
      icon: <HiOutlineHandRaised className={styles.iconSvg} />,
      color: 'warning',
      description: 'awaiting approval',
    },
    {
      id: 'system-health',
      title: "Today's Activity",
      value: upcoming_bookings,
      icon: <DashboardClockIcon className={styles.iconSvg} />,
      color: 'success',
      description: 'sessions scheduled',
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
    <div className={styles.adminDashboardLayout}>
      <div className={styles.layoutHeader}>
        <h3 className={styles.layoutTitle}>System Overview</h3>
        <p className={styles.layoutSubtitle}>Monitor system-wide resource management and activity</p>
      </div>

      <div className={styles.systemGrid}>
        {systemCards.map((card) => (
          <div
            key={card.id}
            className={`${styles.systemCard} ${getCardColorClass(card.color)}`}
            onClick={() => card.id === 'pending-actions' && navigate('/admin/pending-requests')}
            style={card.id === 'pending-actions' ? { cursor: 'pointer' } : {}}
          >
            <div className={styles.cardInfo}>
              <div className={styles.cardHeader}>
                <div className={styles.cardIconWrap}>
                  {card.icon}
                </div>
                <h4 className={styles.cardTitle}>{card.title}</h4>
              </div>
              <div className={styles.cardValue}>{card.value}</div>
              <div className={styles.cardFooter}>
                <p className={styles.cardDescription}>{card.description}</p>
                {card.id === 'pending-actions' && (
                  <button
                    type="button"
                    className={styles.viewAllButton}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/admin/pending-requests');
                    }}
                  >
                    View All
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
