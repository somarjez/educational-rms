import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiUsers,
} from 'react-icons/fi';
import { getBookings } from '../../services/schedulingApi';
import { useAuthStore } from '../../stores/authStore';
import DashboardHeader from '../../features/dashboard/core/DashboardHeader';
import { DashboardBellIcon } from '../../features/dashboard/icons/DashboardIcons';
import notificationConfirmedIcon from '../../assets/notifications/notification-confirmed.svg';
import notificationDeclinedIcon from '../../assets/notifications/notification-declined.svg';
import notificationPendingIcon from '../../assets/notifications/notification-pending.svg';
import '../../features/dashboard/core/styles/Dashboard.css';
import './LandingPages.css';

const toList = (data) => (Array.isArray(data) ? data : data?.results || []);

const statusConfig = {
  APPROVED: {
    title: 'Booking Confirmed',
    status: 'CONFIRMED',
    message: 'is confirmed.',
    icon: notificationConfirmedIcon,
    tone: 'confirmed',
  },
  CONFIRMED: {
    title: 'Booking Confirmed',
    status: 'CONFIRMED',
    message: 'is confirmed.',
    icon: notificationConfirmedIcon,
    tone: 'confirmed',
  },
  PENDING: {
    title: 'Booking Pending Approval',
    status: 'PENDING',
    message: 'is pending approval.',
    icon: notificationPendingIcon,
    tone: 'pending',
  },
  REJECTED: {
    title: 'Booking Declined',
    status: 'DECLINED',
    message: 'is declined.',
    icon: notificationDeclinedIcon,
    tone: 'declined',
  },
  CANCELLED: {
    title: 'Booking Declined',
    status: 'DECLINED',
    message: 'is declined.',
    icon: notificationDeclinedIcon,
    tone: 'declined',
  },
};

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  });
};

const formatTime = (value) => {
  if (!value) return '';
  if (String(value).includes('T')) {
    const date = new Date(value);
    if (!Number.isNaN(date.getTime())) {
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });
    }
  }

  return String(value).slice(0, 5);
};

const getTimeRange = (item) => {
  const start = item.start_time || item.time_slot_details?.start_time || item.time || '';
  const end = item.end_time || item.time_slot_details?.end_time || '';
  const formattedStart = formatTime(start);
  const formattedEnd = formatTime(end);

  if (formattedStart && formattedEnd) return `${formattedStart} - ${formattedEnd}`;
  return formattedStart || 'N/A';
};

const getUserName = (item) => (
  item.user_name
  || item.created_by_name
  || item.user?.username
  || item.user?.email
  || item.requested_by
  || 'shailavellenda'
);

const NotificationsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [bookings, setBookings] = useState([]);
  const [dismissedIds, setDismissedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        setLoading(true);
        const data = await getBookings();
        setBookings(toList(data));
        setError('');
      } catch (err) {
        setBookings([]);
        setError('Failed to load notifications.');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const notifications = useMemo(() => {
    const dismissed = new Set(dismissedIds);

    return bookings
      .map((item) => {
        const normalizedStatus = String(item.status || '').toUpperCase();
        const config = statusConfig[normalizedStatus];
        if (!config) return null;

        const roomName = item.room_name || item.room?.name || item.resource_name || 'Classroom A101';
        const id = `${normalizedStatus.toLowerCase()}-${item.id}`;

        return {
          id,
          title: config.title,
          message: `Booking for ${roomName} ${config.message}`,
          status: config.status,
          tone: config.tone,
          icon: config.icon,
          userName: getUserName(item),
          participants: item.participants_count || item.room?.capacity || item.capacity || 30,
          date: formatDate(item.booking_date || item.date || item.start_time || item.created_at),
          time: getTimeRange(item),
        };
      })
      .filter((item) => item && !dismissed.has(item.id))
      .slice(0, 8);
  }, [bookings, dismissedIds]);

  const deleteAllNotifications = () => {
    setDismissedIds((current) => [
      ...current,
      ...notifications.map((notification) => notification.id),
    ]);
  };

  return (
    <div className="dashboard notifications-dashboard">
      <DashboardHeader
        user={user || {}}
        onLogout={handleLogout}
        onProfileClick={() => navigate('/profile')}
      />

      <div className="notifications-page">
        <div className="notifications-heading">
          <div className="notifications-title-row">
            <span className="notifications-heading-icon" aria-hidden="true">
              <DashboardBellIcon />
            </span>
            <div>
              <h1 className="notifications-title">NOTIFICATIONS</h1>
              <p className="notifications-subtitle">Recent booking updates and reminders.</p>
            </div>
          </div>

          {notifications.length > 0 && (
            <button
              type="button"
              className="notifications-delete-link"
              onClick={deleteAllNotifications}
            >
              Delete Notification
            </button>
          )}
        </div>

        {loading ? (
          <div className="notification-empty-state">Loading notifications...</div>
        ) : error ? (
          <div className="notification-empty-state">{error}</div>
        ) : notifications.length === 0 ? (
          <div className="notification-empty-state">No notifications yet.</div>
        ) : (
          <div className="notification-board">
            {notifications.map((item) => (
              <article key={item.id} className="notification-row">
                <div className={`notification-status-icon ${item.tone}`}>
                  <img src={item.icon} alt="" aria-hidden="true" />
                </div>

                <div className="notification-main">
                  <div className="notification-row-top">
                    <h2 className={`notification-row-title ${item.tone}`}>{item.title}</h2>
                    <span className={`notification-status-badge ${item.tone}`}>
                      {item.status}
                    </span>
                  </div>

                  <p className="notification-message">{item.message}</p>

                  <div className="notification-meta">
                    <span><FiUser aria-hidden="true" /> {item.userName}</span>
                    <span><FiUsers aria-hidden="true" /> {item.participants} persons</span>
                    <span><FiCalendar aria-hidden="true" /> {item.date}</span>
                    <span><FiClock aria-hidden="true" /> {item.time}</span>
                  </div>
                </div>
              </article>
            ))}

            <div className="notification-board-footer" aria-hidden="true" />
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationsPage;
