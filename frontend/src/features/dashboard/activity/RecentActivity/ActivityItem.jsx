import React from 'react';
import {
  DashboardCalendarIcon,
  DashboardClockIcon,
  DashboardUsersIcon,
} from '../../icons/DashboardIcons';

const ActivityItem = ({ booking, getStatusClass, formatDate, styles }) => {
  const roomName = booking.room_name || booking.room?.name || 'Classroom';
  const bookingDate = booking.booking_date || booking.date;
  const startTime = booking.start_time || booking.time || 'N/A';
  const endTime = booking.end_time || booking.time_slot_details?.end_time || '';
  const participants = booking.participants_count || booking.room?.capacity || booking.capacity || 'N/A';
  const timeLabel = endTime ? `${startTime} - ${endTime}` : startTime;

  return (
    <div className={styles.activityItem}>
      <div className={styles.activityLead} />
      <div className={styles.activityBody}>
        <div className={styles.activityHeader}>
          <span className={styles.activityType}>{roomName}</span>
          <span className={`${styles.activityStatus} ${styles[getStatusClass(booking.status)]}`}>
            {booking.status}
          </span>
        </div>

        <div className={styles.activityMeta}>
          <span className={styles.activityMetaItem}>
            <DashboardUsersIcon className={styles.activityMetaIcon} />
            {participants} members
          </span>
          <span className={styles.activityMetaItem}>
            <DashboardCalendarIcon className={styles.activityMetaIcon} />
            {formatDate(bookingDate)}
          </span>
          <span className={styles.activityMetaItem}>
            <DashboardClockIcon className={styles.activityMetaIcon} />
            {timeLabel}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ActivityItem;
