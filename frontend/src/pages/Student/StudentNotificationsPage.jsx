import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import useDashboardData from '../../hooks/booking/useDashboardData';
import { useAuthStore } from '../../stores/authStore';
import './styles/StudentPages.css';

const getNotifications = (bookings = []) => {
  const statusText = {
    PENDING: 'Pending review',
    APPROVED: 'Approved',
    CONFIRMED: 'Confirmed',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
    COMPLETED: 'Completed',
  };

  return bookings.slice(0, 20).map((booking) => ({
    id: booking.id,
    title: booking.purpose || 'Booking update',
    message: `${booking.room_name || 'Room update'} | ${statusText[booking.status] || booking.status}`,
    date: booking.date,
    status: booking.status,
  }));
};

const StudentNotificationsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { dashboardData, loading, error } = useDashboardData(user, navigate);

  const notifications = useMemo(
    () => getNotifications(dashboardData?.recent_bookings || []),
    [dashboardData?.recent_bookings]
  );

  return (
    <div className="student-page">
      <div className="student-page-header">
        <div>
          <h1 className="student-page-title">Notifications</h1>
          <p className="student-page-subtitle">Booking updates, reminders, and status messages for your account.</p>
        </div>
      </div>

      <div className="student-page-card">
        {error && <p className="student-error">{error}</p>}
        {loading ? (
          <p className="student-empty">Loading notifications...</p>
        ) : notifications.length === 0 ? (
          <p className="student-empty">No notifications yet. Booking updates will appear here.</p>
        ) : (
          <ul className="student-list">
            {notifications.map((item) => (
              <li className="student-list-item" key={item.id}>
                <div className="student-list-row">
                  <strong>{item.title}</strong>
                  <span className={`student-status student-status-${String(item.status || '').toLowerCase()}`}>{item.status || 'Update'}</span>
                </div>
                <p className="student-list-meta">{item.message}</p>
                <p className="student-list-meta">Date: {item.date || 'N/A'}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StudentNotificationsPage;
