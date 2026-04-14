import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './styles/NotificationsPage.css';

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/scheduling/notifications/');
      const data = response.data.results || response.data || [];
      setNotifications(Array.isArray(data) ? data : []);
      setUnreadCount(data.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/scheduling/notifications/${notificationId}/mark_read/`);
      fetchNotifications();
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/scheduling/notifications/${notificationId}/`);
      fetchNotifications();
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await api.post('/scheduling/notifications/mark_all_read/');
      fetchNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'STATUS_ALERT':
        return '📢';
      case 'REMINDER':
        return '🔔';
      case 'OVERDUE_ALERT':
        return '⚠️';
      case 'CONFLICT_ALERT':
        return '🚫';
      default:
        return '📬';
    }
  };

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>🔔 Notifications</h1>
        <div className="header-info">
          <span className="unread-badge">{unreadCount} unread</span>
          {unreadCount > 0 && (
            <button className="mark-all-btn" onClick={markAllRead}>
              Mark all as read
            </button>
          )}
        </div>
      </div>

      {loading && <div className="loading">Loading notifications...</div>}

      {!loading && notifications.length === 0 && (
        <div className="empty-state">
          <p>📭 No notifications yet</p>
        </div>
      )}

      {!loading && notifications.length > 0 && (
        <div className="notifications-list">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-card ${notif.is_read ? 'read' : 'unread'}`}
            >
              <div className="notification-icon">
                {getNotificationIcon(notif.notification_type)}
              </div>
              <div className="notification-content">
                <h3>{notif.title}</h3>
                <p>{notif.message}</p>
                <small>
                  {new Date(notif.created_at).toLocaleString()} • {notif.notification_type_display}
                </small>
              </div>
              <div className="notification-actions">
                {!notif.is_read && (
                  <button
                    className="btn-read"
                    onClick={() => markAsRead(notif.id)}
                    title="Mark as read"
                  >
                    ✓
                  </button>
                )}
                <button
                  className="btn-delete"
                  onClick={() => deleteNotification(notif.id)}
                  title="Delete"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
