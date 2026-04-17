import React, { useEffect, useMemo, useState } from 'react';
import { getBookings } from '../../services/schedulingApi';
import { FiMapPin, FiClock } from 'react-icons/fi';
import './LandingPages.css';

const toList = (data) => (Array.isArray(data) ? data : data?.results || []);

const buildDate = (item) => {
  if (item.start_time && String(item.start_time).includes('T')) {
    return new Date(item.start_time);
  }
  if (item.booking_date) {
    return new Date(`${item.booking_date}T${item.start_time || '00:00'}`);
  }
  if (item.date) {
    return new Date(`${item.date}T${item.time || '00:00'}`);
  }
  return new Date('invalid');
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

const getStatusBadgeClass = (status) => {
  const normalized = status?.toUpperCase() || 'DEFAULT';
  if (['CONFIRMED', 'APPROVED'].includes(normalized)) return 'status-confirmed';
  if (normalized === 'PENDING') return 'status-pending';
  if (['REJECTED', 'CANCELLED'].includes(normalized)) return 'status-rejected';
  return 'status-default';
};

const SchedulePage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        setLoading(true);
        const data = await getBookings();
        setBookings(toList(data));
        setError('');
      } catch (err) {
        setBookings([]);
        setError('Failed to load schedule.');
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const upcoming = useMemo(() => {
    return bookings
      .map((item) => ({ item, when: buildDate(item) }))
      .filter(({ when }) => !Number.isNaN(when.getTime()))
      .sort((a, b) => b.when - a.when); // Sort by newest first
  }, [bookings]);

  return (
    <div className="landing-page">
      <div className="landing-header">
        <div>
          <h1 className="landing-title">My Schedule</h1>
          <p className="landing-subtitle">View all your bookings and reservation details.</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading schedule...</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : upcoming.length === 0 ? (
        <div className="empty-state">No bookings found.</div>
      ) : (
        <div className="schedule-timeline">
          {upcoming.map(({ item, when }) => {
            const timeStr = item.start_time && String(item.start_time).includes(':') 
              ? item.start_time.substring(0, 5)
              : item.time || 'N/A';
            const dateStr = when.toLocaleDateString('en-US', { 
              weekday: 'short',
              month: 'short', 
              day: 'numeric',
              year: 'numeric'
            });
            
            return (
              <div key={item.id} className="timeline-event">
                <div 
                  className="timeline-indicator" 
                  style={{ backgroundColor: getStatusColor(item.status) }}
                />
                <div className="timeline-content">
                  <div className="timeline-header">
                    <div className="timeline-date">{dateStr}</div>
                    <div className="timeline-time">{timeStr}</div>
                  </div>
                  <div className="timeline-details">
                    <div className="timeline-room">
                      <FiMapPin className="timeline-icon" />
                      <span>{item.room_name || item.room?.name || item.resource_name || 'Resource'}</span>
                    </div>
                    {item.course_code && (
                      <div className="timeline-course">{item.course_code}</div>
                    )}
                  </div>
                </div>
                <span className={`timeline-status-badge status-pill status-${getStatusBadgeClass(item.status).split('-')[1]}`}>
                  {item.status || 'UNKNOWN'}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SchedulePage;
