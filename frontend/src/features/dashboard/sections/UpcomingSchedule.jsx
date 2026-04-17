import React, { useState, useEffect, useCallback } from 'react';
import { FiCalendar, FiArrowRight, FiRefreshCw } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import styles from './styles/ScheduleSections.module.css';
import { getBookings } from '../../../services/schedulingApi';

const UpcomingSchedule = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedDate] = useState(new Date());

  // Fetch today's bookings for the current student
  const fetchTodayEvents = useCallback(async () => {
    try {
      setLoading(true);
      const dateStr = selectedDate.toISOString().split('T')[0];
      // Get only current user's bookings (already filtered by auth)
      const response = await getBookings();
      const allBookings = Array.isArray(response) ? response : response.results || [];
      
      // Additional client-side filter to ensure ONLY today's bookings are shown
      const todayBookings = allBookings.filter(booking => {
        const bookingDate = booking.booking_date || booking.date;
        if (!bookingDate) return false;
        // Extract just the date part (YYYY-MM-DD)
        const bookingDateStr = String(bookingDate).split('T')[0];
        return bookingDateStr === dateStr;
      });
      
      // Transform bookings to match EventTimeline format
      const transformedEvents = todayBookings.map((booking) => ({
        id: booking.id,
        time: booking.start_time ? booking.start_time.substring(0, 5) : booking.time || 'N/A',
        room_name: booking.room?.name || booking.room_name || 'Resource',
        user_name: booking.user_name || booking.user?.username || 'You',
        status: booking.status,
      }));
      setEvents(transformedEvents);
    } catch (error) {
      console.error('Error fetching today\'s schedule:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDate]);

  useEffect(() => {
    fetchTodayEvents();
  }, [fetchTodayEvents]);

  // Auto-refresh when window regains focus
  useEffect(() => {
    const handleFocus = () => {
      fetchTodayEvents();
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchTodayEvents]);

  // Periodic refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchTodayEvents();
    }, 30000);

    return () => clearInterval(interval);
  }, [fetchTodayEvents]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await fetchTodayEvents();
    setIsRefreshing(false);
  };

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

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className={styles.scheduleCard}>
      <div className={styles.scheduleHeader}>
        <div>
          <h3 className={styles.scheduleTitle}>
            <FiCalendar className={styles.icon} />
            Today's Schedule
          </h3>
          <p className={styles.scheduleSubtitle}>{formatDate(selectedDate)}</p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <button
            className={styles.refreshBtn}
            onClick={handleManualRefresh}
            disabled={isRefreshing || loading}
            title="Refresh schedule"
            aria-label="Refresh schedule"
          >
            <FiRefreshCw style={{ 
              transform: isRefreshing ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.3s ease'
            }} />
          </button>
          <button
            className={styles.viewAllLink}
            onClick={() => navigate('/schedule')}
            title="View full schedule"
          >
            View All <FiArrowRight />
          </button>
        </div>
      </div>

      {loading ? (
        <div className={styles.calendarLoading}>Loading events...</div>
      ) : events.length > 0 ? (
        <div className={styles.eventsTimeline}>
          {events.map((event) => (
            <div key={event.id} className={styles.timelineEvent}>
              <div 
                className={styles.eventIndicator}
                style={{ backgroundColor: getStatusColor(event.status) }}
              />
              <div className={styles.eventContent}>
                <div className={styles.eventTime}>{event.time}</div>
                <div className={styles.eventDetails}>
                  <p className={styles.eventRoom}>{event.room_name}</p>
                  <p className={styles.eventUser}>{event.user_name}</p>
                </div>
                <span 
                  className={styles.eventStatusBadge}
                  style={{ 
                    backgroundColor: getStatusColor(event.status),
                    color: 'white'
                  }}
                >
                  {event.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className={styles.noEvents}>
          <div className={styles.noEventsIcon}>🎉</div>
          <p>No bookings scheduled for today</p>
        </div>
      )}
    </div>
  );
};

export default UpcomingSchedule;
