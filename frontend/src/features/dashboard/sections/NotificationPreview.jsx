import React from 'react';
import { FiBell, FiCheckCircle, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styles from './styles/ScheduleSections.module.css';

const NotificationPreview = ({ bookings = [] }) => {
  const navigate = useNavigate();

  // Generate notifications from booking statuses (simulated notifications)
  const generateNotifications = () => {
    const notifications = [];

    // Add notifications for pending bookings
    bookings
      .filter(b => b.status === 'PENDING')
      .slice(0, 2)
      .forEach(booking => {
        notifications.push({
          id: `pending-${booking.id}`,
          type: 'pending',
          title: 'Booking Pending',
          message: `Your booking for ${booking.room?.name || 'a resource'} awaits approval`,
          timestamp: booking.created_at,
        });
      });

    // Add notifications for confirmed bookings (recent ones)
    bookings
      .filter(b => b.status === 'CONFIRMED')
      .slice(0, 2)
      .forEach(booking => {
        notifications.push({
          id: `confirmed-${booking.id}`,
          type: 'confirmed',
          title: 'Booking Confirmed',
          message: `Your booking for ${booking.room?.name || 'a resource'} is confirmed`,
          timestamp: booking.created_at,
        });
      });

    // Add system notification
    if (bookings.length > 0) {
      notifications.push({
        id: 'system-1',
        type: 'system',
        title: 'Resource Available',
        message: 'Check available equipment in the Equipment section',
        timestamp: new Date().toISOString(),
      });
    }

    return notifications.slice(0, 5);
  };

  const notifications = generateNotifications();

  const formatTime = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'confirmed':
        return <FiCheckCircle className={styles.iconConfirmed} />;
      case 'pending':
        return <FiAlertCircle className={styles.iconPending} />;
      default:
        return <FiBell className={styles.iconDefault} />;
    }
  };

  const getNotificationClass = (type) => {
    switch (type) {
      case 'confirmed':
        return styles.notificationConfirmed;
      case 'pending':
        return styles.notificationPending;
      default:
        return styles.notificationDefault;
    }
  };

  return (
    <div className={styles.notificationCard}>
      <div className={styles.notificationHeader}>
        <h3 className={styles.notificationTitle}>
          <FiBell className={styles.icon} />
          Notifications
        </h3>
        <button
          className={styles.viewAllLink}
          onClick={() => navigate('/notifications')}
          title="View all notifications"
        >
          View All <FiArrowRight />
        </button>
      </div>

      <div className={styles.notificationList}>
        {notifications.length > 0 ? (
          notifications.map((notification) => (
            <div
              key={notification.id}
              className={`${styles.notificationItem} ${getNotificationClass(notification.type)}`}
            >
              <div className={styles.notificationIcon}>
                {getNotificationIcon(notification.type)}
              </div>
              <div className={styles.notificationContent}>
                <h4 className={styles.notificationItemTitle}>
                  {notification.title}
                </h4>
                <p className={styles.notificationMessage}>
                  {notification.message}
                </p>
              </div>
              <div className={styles.notificationTime}>
                {formatTime(notification.timestamp)}
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <FiBell className={styles.emptyIcon} />
            <p>No notifications yet</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPreview;
