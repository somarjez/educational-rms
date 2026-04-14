import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FiHardDrive, FiLayers, FiActivity, FiUsers } from 'react-icons/fi';
import NotificationPreview from './NotificationPreview';
import EquipmentPreview from './EquipmentPreview';
import styles from './styles/AdminDashboardLayout.module.css';

const AdminDashboardLayout = ({ bookingStats = {}, schedulingStats = {}, recentBookings = [] }) => {
  const navigate = useNavigate();
  const {
    total_bookings = 0,
    confirmed_bookings = 0,
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
      icon: <FiLayers className={styles.cardIcon} />,
      color: 'primary',
      description: 'Resources managed',
    },
    {
      id: 'total-bookings',
      title: 'System Bookings',
      value: total_bookings,
      icon: <FiActivity className={styles.cardIcon} />,
      color: 'info',
      description: 'Total reservations',
    },
    {
      id: 'pending-actions',
      title: 'Pending Requests',
      value: pendingRequestsCount,
      icon: <FiUsers className={styles.cardIcon} />,
      color: 'warning',
      description: 'Awaiting approval',
    },
    {
      id: 'system-health',
      title: "Today's Activity",
      value: upcoming_bookings,
      icon: <FiHardDrive className={styles.cardIcon} />,
      color: 'success',
      description: 'Sessions scheduled',
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
            <div className={styles.cardIcon}>
              {card.icon}
            </div>
            <div className={styles.cardInfo}>
              <h4 className={styles.cardTitle}>{card.title}</h4>
              <div className={styles.cardValue}>{card.value}</div>
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
        ))}
      </div>

      <NotificationPreview bookings={recentBookings} />
      <EquipmentPreview />

      <div className={styles.managementSection}>
        <div className={styles.managementHeader}>
          <h4 className={styles.managementTitle}>System Status</h4>
        </div>

        <div className={styles.statusItems}>
          <div className={styles.statusItem}>
            <div className={styles.statusIndicator} style={{ backgroundColor: '#22c55e' }}></div>
            <div className={styles.statusInfo}>
              <span className={styles.statusLabel}>Confirmation Rate</span>
              <span className={styles.statusValue}>
                {total_bookings > 0 ? Math.round((confirmed_bookings / total_bookings) * 100) : 0}%
              </span>
            </div>
          </div>

          <div className={styles.statusItem}>
            <div className={styles.statusIndicator} style={{ backgroundColor: '#ca8a04' }}></div>
            <div className={styles.statusInfo}>
              <span className={styles.statusLabel}>Pending Requests</span>
              <span className={styles.statusValue}>{pendingRequestsCount}</span>
            </div>
          </div>

          <div className={styles.statusItem}>
            <div className={styles.statusIndicator} style={{ backgroundColor: '#0066cc' }}></div>
            <div className={styles.statusInfo}>
              <span className={styles.statusLabel}>Resources Configured</span>
              <span className={styles.statusValue}>{total_rooms}</span>
            </div>
          </div>
        </div>
      </div>

      <div className={styles.notesSection}>
        <p className={styles.noteText}>
          All system data is automatically synchronized. Use the Scheduling & Resources tab to manage rooms, equipment, and bookings.
        </p>
      </div>
    </div>
  );
};

export default AdminDashboardLayout;
