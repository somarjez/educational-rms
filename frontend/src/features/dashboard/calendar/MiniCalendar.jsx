import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import EventTimeline from './MiniCalendar/EventTimeline';
import DateDisplay from './MiniCalendar/DateDisplay';
import useCalendarEvents from '../../../hooks/booking/useCalendarEvents';
import styles from './styles/MiniCalendar.module.css';

const MiniCalendar = ({ userRole, user }) => {
  const navigate = useNavigate();
  const [selectedDate] = useState(new Date());
  const { events, loading } = useCalendarEvents(selectedDate, userRole, user);
  const normalizedRole = userRole?.toUpperCase?.() || '';
  const isAdminLike = normalizedRole === 'ADMIN' || normalizedRole === 'FACULTY';

  const getStatusColor = (status) => {
    const colors = {
      PENDING: '#f59e0b',
      APPROVED: '#3b82f6',
      CONFIRMED: '#10b981',
      CANCELLED: '#6b7280',
      REJECTED: '#ef4444',
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div className={styles.miniCalendarWidget} id="schedule-panel">
      <div className={styles.widgetHeader}>
        <h3>Today's Schedule</h3>
        <button 
          className={styles.viewFullBtn}
          onClick={() => navigate(isAdminLike ? '/admin-scheduling' : '/student/schedule')}
        >
          {isAdminLike ? 'Full Calendar' : 'View Schedule'}
        </button>
      </div>

      <DateDisplay selectedDate={selectedDate} styles={styles} />

      {loading ? (
        <div className={styles.calendarLoading}>Loading events...</div>
      ) : events.length > 0 ? (
        <EventTimeline events={events} getStatusColor={getStatusColor} styles={styles} />
      ) : (
        <div className={styles.noEvents}>
          <div className={styles.noEventsIcon}>🎉</div>
          <p>No bookings scheduled for today</p>
        </div>
      )}
    </div>
  );
};

export default MiniCalendar;
