import React from 'react';
import styles from './styles/AdminStatusPanel.module.css';

const AdminStatusPanel = ({ bookingStats = {}, schedulingStats = {} }) => {
  const {
    total_bookings = 0,
    confirmed_bookings = 0,
    pending_bookings = 0,
  } = bookingStats || {};
  const {
    total_rooms = 0,
  } = schedulingStats || {};

  const statusItems = [
    {
      id: 'confirmation-rate',
      label: 'Confirmation Rate',
      value: `${total_bookings > 0 ? Math.round((confirmed_bookings / total_bookings) * 100) : 0}%`,
      color: '#22c55e',
    },
    {
      id: 'pending-requests',
      label: 'Pending Requests',
      value: pending_bookings,
      color: '#ca8a04',
    },
    {
      id: 'resources-configured',
      label: 'Resources Configured',
      value: total_rooms,
      color: '#0066cc',
    },
  ];

  return (
    <div className={styles.statusPanel}>
      <div className={styles.sectionHeader}>
        <h3 className={styles.sectionTitle}>System Status</h3>
      </div>

      <div className={styles.statusItems}>
        {statusItems.map((item) => (
          <div key={item.id} className={styles.statusItem}>
            <div className={styles.statusIndicator} style={{ backgroundColor: item.color }}></div>
            <div className={styles.statusInfo}>
              <span className={styles.statusLabel}>{item.label}</span>
              <span className={styles.statusValue}>{item.value}</span>
            </div>
          </div>
        ))}
      </div>

      <div className={styles.noteBox}>
        <p className={styles.noteText}>
          All system data is automatically synchronized. Use the Scheduling & Resources tab to manage rooms, equipment, and bookings.
        </p>
      </div>
    </div>
  );
};

export default AdminStatusPanel;
