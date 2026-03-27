import React, { useEffect, useMemo, useState } from 'react';
import { getBookings } from '../../services/schedulingApi';
import './styles/StudentPages.css';

const normalizeBookings = (response) => {
  if (Array.isArray(response)) {
    return response;
  }
  if (Array.isArray(response?.results)) {
    return response.results;
  }
  return response ? [response] : [];
};

const formatDate = (value) => {
  if (!value) {
    return 'N/A';
  }
  return new Date(value).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const formatTime = (timeSlotDetails) => {
  if (!timeSlotDetails) {
    return 'N/A';
  }
  return `${String(timeSlotDetails.start_time || '').slice(0, 5)} - ${String(timeSlotDetails.end_time || '').slice(0, 5)}`;
};

const StudentSchedulePage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getBookings({ page_size: 100 });
        const bookingList = normalizeBookings(response);
        setBookings(bookingList);
      } catch (fetchError) {
        setError('Unable to load your schedule right now.');
        setBookings([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSchedule();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => {
      const dateA = `${a?.date || ''} ${a?.time_slot_details?.start_time || ''}`;
      const dateB = `${b?.date || ''} ${b?.time_slot_details?.start_time || ''}`;
      return new Date(dateA) - new Date(dateB);
    });
  }, [bookings]);

  const todaysBookings = useMemo(
    () => sortedBookings.filter((item) => item?.date && new Date(item.date).toDateString() === today.toDateString()),
    [sortedBookings, today]
  );

  const upcomingBookings = useMemo(
    () => sortedBookings.filter((item) => item?.date && new Date(item.date) >= today),
    [sortedBookings, today]
  );

  return (
    <div className="student-page">
      <div className="student-page-header">
        <div>
          <h1 className="student-page-title">My Schedule</h1>
          <p className="student-page-subtitle">Today and upcoming reservation schedule for your account.</p>
        </div>
      </div>

      <div className="student-page-card student-grid">
        <div className="student-stat">
          <span className="student-stat-label">Today</span>
          <span className="student-stat-value">{todaysBookings.length}</span>
        </div>
        <div className="student-stat">
          <span className="student-stat-label">Upcoming</span>
          <span className="student-stat-value">{upcomingBookings.length}</span>
        </div>
        <div className="student-stat">
          <span className="student-stat-label">Total Loaded</span>
          <span className="student-stat-value">{bookings.length}</span>
        </div>
      </div>

      <div className="student-page-card">
        <h2 className="student-page-title" style={{ fontSize: '1.2rem' }}>Upcoming Reservations</h2>
        {error && <p className="student-error">{error}</p>}
        {loading ? (
          <p className="student-empty">Loading schedule...</p>
        ) : upcomingBookings.length === 0 ? (
          <p className="student-empty">No upcoming reservations.</p>
        ) : (
          <ul className="student-list">
            {upcomingBookings.map((booking) => (
              <li className="student-list-item" key={booking.id}>
                <div className="student-list-row">
                  <strong>{booking?.purpose || 'Reservation'}</strong>
                  <span className={`student-status student-status-${String(booking?.status || '').toLowerCase()}`}>{booking?.status || 'Unknown'}</span>
                </div>
                <p className="student-list-meta">
                  {formatDate(booking?.date)} | {formatTime(booking?.time_slot_details)} | {booking?.room_name || 'No room'}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StudentSchedulePage;
