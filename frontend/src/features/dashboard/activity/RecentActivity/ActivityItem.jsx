import React from 'react';

const ActivityItem = ({ booking, getStatusClass, formatDate, styles }) => (
  <div className={styles.activityItem}>
    <div className={styles.activityHeader}>
      <span className={styles.activityType}>{booking.room_name}</span>
      <span className={`${styles.activityStatus} ${styles[getStatusClass(booking.status)]}`}>
        {booking.status}
      </span>
    </div>
    <p className={styles.activityDate}>{formatDate(booking.date)} at {booking.time}</p>
  </div>
);

export default ActivityItem;
