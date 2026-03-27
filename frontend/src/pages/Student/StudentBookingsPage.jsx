import React, { useEffect, useMemo, useState } from 'react';
import { cancelBooking, getBookings } from '../../services/schedulingApi';
import './styles/StudentPages.css';

const cancellableStatuses = ['PENDING', 'APPROVED', 'CONFIRMED'];

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

const formatTimeRange = (timeSlotDetails) => {
  if (!timeSlotDetails) {
    return 'N/A';
  }
  return `${String(timeSlotDetails.start_time || '').slice(0, 5)} - ${String(timeSlotDetails.end_time || '').slice(0, 5)}`;
};

const StudentBookingsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [busyBookingId, setBusyBookingId] = useState(null);
  const [expandedBookingId, setExpandedBookingId] = useState(null);

  const fetchBookings = async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page_size: 100 };
      if (statusFilter) {
        params.status = statusFilter;
      }
      const response = await getBookings(params);
      const bookingList = normalizeBookings(response);
      setBookings(bookingList);
    } catch (fetchError) {
      setError('Unable to load your bookings right now.');
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter]);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingCount = useMemo(
    () => bookings.filter((item) => item?.date && new Date(item.date) >= now).length,
    [bookings, now]
  );

  const pastCount = useMemo(
    () => bookings.filter((item) => item?.date && new Date(item.date) < now).length,
    [bookings, now]
  );

  const handleCancelBooking = async (bookingId) => {
    setBusyBookingId(bookingId);
    setError('');
    try {
      await cancelBooking(bookingId, {});
      await fetchBookings();
    } catch (cancelError) {
      setError('Cancellation is not available for this booking.');
    } finally {
      setBusyBookingId(null);
    }
  };

  return (
    <div className="student-page">
      <div className="student-page-header">
        <div>
          <h1 className="student-page-title">My Bookings</h1>
          <p className="student-page-subtitle">Track your reservation status, date, time, and room details.</p>
        </div>
        <div className="student-inline-actions">
          <button className="student-btn secondary" onClick={fetchBookings} disabled={loading}>Refresh</button>
        </div>
      </div>

      <div className="student-page-card student-grid">
        <div className="student-stat">
          <span className="student-stat-label">Total</span>
          <span className="student-stat-value">{bookings.length}</span>
        </div>
        <div className="student-stat">
          <span className="student-stat-label">Upcoming</span>
          <span className="student-stat-value">{upcomingCount}</span>
        </div>
        <div className="student-stat">
          <span className="student-stat-label">Past</span>
          <span className="student-stat-value">{pastCount}</span>
        </div>
      </div>

      <div className="student-page-card">
        <div className="student-list-row">
          <strong>Status Filter</strong>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
            <option value="">All</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="REJECTED">Rejected</option>
            <option value="CANCELLED">Cancelled</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>
      </div>

      <div className="student-page-card">
        {error && <p className="student-error">{error}</p>}
        {loading ? (
          <p className="student-empty">Loading your bookings...</p>
        ) : bookings.length === 0 ? (
          <p className="student-empty">No bookings found for the selected filter.</p>
        ) : (
          <ul className="student-list">
            {bookings.map((booking) => {
              const normalizedStatus = String(booking?.status || '').toLowerCase();
              const canCancel = cancellableStatuses.includes(booking?.status);
              const isExpanded = expandedBookingId === booking.id;

              return (
                <li className="student-list-item" key={booking.id}>
                  <div className="student-list-row">
                    <strong>{booking?.purpose || 'Reservation'}</strong>
                    <span className={`student-status student-status-${normalizedStatus}`}>{booking?.status || 'Unknown'}</span>
                  </div>
                  <p className="student-list-meta">
                    {formatDate(booking?.date)} | {formatTimeRange(booking?.time_slot_details)} | {booking?.room_name || 'No room'}
                  </p>
                  {isExpanded && (
                    <p className="student-list-meta">
                      Notes: {booking?.notes || 'No additional notes'}
                    </p>
                  )}
                  <div className="student-inline-actions">
                    <button
                      className="student-btn secondary"
                      onClick={() => setExpandedBookingId(isExpanded ? null : booking.id)}
                    >
                      {isExpanded ? 'Hide Details' : 'View Details'}
                    </button>
                    {canCancel && (
                      <button
                        className="student-btn"
                        onClick={() => handleCancelBooking(booking.id)}
                        disabled={busyBookingId === booking.id}
                      >
                        {busyBookingId === booking.id ? 'Cancelling...' : 'Cancel'}
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StudentBookingsPage;
