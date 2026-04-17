import React, { useEffect, useMemo, useState } from 'react';
import { getBookings } from '../../services/schedulingApi';
import './LandingPages.css';

const toList = (data) => (Array.isArray(data) ? data : data?.results || []);

const formatDate = (value) => {
  if (!value) return 'N/A';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

const formatTimeRange = (item) => {
  const start = item.start_time || item.time || '';
  const end = item.end_time || '';
  if (start && end) return `${start} - ${end}`;
  return start || 'N/A';
};

const statusClass = (status = '') => {
  const normalized = status.toLowerCase();
  if (['confirmed', 'approved'].includes(normalized)) return 'status-pill status-confirmed';
  if (normalized === 'pending') return 'status-pill status-pending';
  if (['rejected', 'cancelled'].includes(normalized)) return 'status-pill status-rejected';
  return 'status-pill status-default';
};

const BookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = async (initialLoad = false) => {
    try {
      if (initialLoad) {
        setLoading(true);
      }
      const data = await getBookings();
      setBookings(toList(data));
      setError('');
    } catch (err) {
      if (initialLoad) {
        setBookings([]);
      }
      setError('Failed to load bookings.');
    } finally {
      if (initialLoad) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchBookings(true);

    const intervalId = window.setInterval(() => {
      fetchBookings(false);
    }, 15000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, []);

  const stats = useMemo(() => {
    const pending = bookings.filter((item) => String(item.status).toUpperCase() === 'PENDING').length;
    const confirmed = bookings.filter((item) => ['CONFIRMED', 'APPROVED'].includes(String(item.status).toUpperCase())).length;
    return { total: bookings.length, pending, confirmed };
  }, [bookings]);

  return (
    <div className="landing-page">
      <div className="landing-header">
        <div>
          <h1 className="landing-title">Bookings</h1>
          <p className="landing-subtitle">View booking status, resource, and schedule details.</p>
        </div>
      </div>

      <div className="landing-grid">
        <div className="landing-stat">
          <div className="landing-stat-label">Total Bookings</div>
          <div className="landing-stat-value">{stats.total}</div>
        </div>
        <div className="landing-stat">
          <div className="landing-stat-label">Pending</div>
          <div className="landing-stat-value">{stats.pending}</div>
        </div>
        <div className="landing-stat">
          <div className="landing-stat-label">Confirmed</div>
          <div className="landing-stat-value">{stats.confirmed}</div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading bookings...</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">No bookings found.</div>
      ) : (
        <div className="landing-list">
          <div className="landing-list-header">
            <span>Resource</span>
            <span>Date</span>
            <span>Time</span>
            <span>Status</span>
          </div>
          {bookings.map((item) => (
            <div key={item.id} className="landing-list-item">
              <span>{item.room_name || item.room?.name || item.resource_name || 'N/A'}</span>
              <span>{formatDate(item.booking_date || item.date || item.start_time)}</span>
              <span>{formatTimeRange(item)}</span>
              <span>
                <span className={statusClass(item.status)}>{item.status || 'UNKNOWN'}</span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default BookingsPage;
