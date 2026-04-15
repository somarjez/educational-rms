import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import './styles/Notifications.css';

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showPanel, setShowPanel] = useState(false);
  const [loading, setLoading] = useState(false);

  const pendingApprovals = useMemo(
    () => notifications.filter(
      (notification) =>
        notification.notification_type === 'STATUS_ALERT'
        && (
          (typeof notification.title === 'string' && /request/i.test(notification.title))
          || (typeof notification.message === 'string' && /approve|approval|review/i.test(notification.message))
        )
    ),
    [notifications]
  );

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
    // Poll for new notifications every 30 seconds
    const interval = setInterval(() => {
      fetchUnreadCount();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get('/scheduling/notifications/');
      const data = response.data.results || response.data || [];
      setNotifications(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/scheduling/notifications/');
      const data = response.data.results || response.data || [];
      const pendingOnly = Array.isArray(data)
        ? data.filter(
          (notification) =>
            notification.notification_type === 'STATUS_ALERT'
            && (
              (typeof notification.title === 'string' && /request/i.test(notification.title))
              || (typeof notification.message === 'string' && /approve|approval|review/i.test(notification.message))
            )
            && !notification.is_read
        )
        : [];
      setUnreadCount(pendingOnly.length);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      await api.post(`/scheduling/notifications/${notificationId}/mark_read/`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      const unreadPending = pendingApprovals.filter((notification) => !notification.is_read);
      await Promise.all(
        unreadPending.map((notification) => api.post(`/scheduling/notifications/${notification.id}/mark_read/`))
      );
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleOpenPendingRequest = async (notificationId) => {
    await markAsRead(notificationId);
    setShowPanel(false);
    navigate('/admin-scheduling?tab=bookings&filter=pending');
  };

  const deleteNotification = async (notificationId) => {
    try {
      await api.delete(`/scheduling/notifications/${notificationId}/`);
      fetchNotifications();
      fetchUnreadCount();
    } catch (error) {
      console.error('Error deleting notification:', error);
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
    <div className="notifications-container">
      {/* Notification Bell Icon */}
      <button
        className="notification-bell"
        onClick={() => setShowPanel(!showPanel)}
        title="Notifications"
      >
        🔔
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount > 9 ? '9+' : unreadCount}</span>
        )}
      </button>

      {/* Notification Panel */}
      {showPanel && (
        <div className="notification-panel">
          <div className="notification-header">
            <h3>Pending Approvals</h3>
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={markAllRead}
                title="Mark all as read"
              >
                ✓ Mark all read
              </button>
            )}
          </div>

          <div className="notification-list">
            {loading && <div className="loading">Loading...</div>}

            {!loading && pendingApprovals.length === 0 && (
              <div className="no-notifications">
                <p>No pending requests for approval.</p>
              </div>
            )}

            {!loading && pendingApprovals.length > 0 && (
              <div>
                {pendingApprovals.map((notification) => (
                  <div
                    key={notification.id}
                    className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
                  >
                    <div className="notification-content">
                      <div className="notification-icon">
                        {getNotificationIcon(notification.notification_type)}
                      </div>
                      <div className="notification-text">
                        <h4>{notification.title}</h4>
                        <p>{notification.message}</p>
                        <small className="notification-time">
                          {new Date(notification.created_at).toLocaleString()}
                        </small>
                      </div>
                    </div>
                    <div className="notification-actions">
                      <button
                        className="action-btn read-btn"
                        onClick={() => handleOpenPendingRequest(notification.id)}
                        title="Open pending approvals"
                      >
                        Open
                      </button>
                      {!notification.is_read && (
                        <button
                          className="action-btn read-btn"
                          onClick={() => markAsRead(notification.id)}
                          title="Mark as read"
                        >
                          ✓
                        </button>
                      )}
                      <button
                        className="action-btn delete-btn"
                        onClick={() => deleteNotification(notification.id)}
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
        </div>
      )}
    </div>
  );
};

export default Notifications;
