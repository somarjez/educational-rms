import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './FeatureLanding.css';

const BookingsLanding = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({ status: 'ALL' });

  useEffect(() => {
    fetchBookings();
  }, [filters]);

  const fetchBookings = async () => {
    try {
      const params = filters.status !== 'ALL' ? { status: filters.status } : {};
      const response = await api.get('/scheduling/bookings/', { params });
      // Handle paginated responses
      const bookingsData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setBookings(bookingsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch bookings');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveBooking = async (bookingId) => {
    try {
      await api.patch(`/scheduling/bookings/${bookingId}/`, { status: 'APPROVED' });
      fetchBookings();
    } catch (err) {
      setError('Failed to approve booking');
    }
  };

  const handleRejectBooking = async (bookingId) => {
    try {
      await api.patch(`/scheduling/bookings/${bookingId}/`, { status: 'REJECTED' });
      fetchBookings();
    } catch (err) {
      setError('Failed to reject booking');
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Cancel this booking?')) {
      try {
        await api.patch(`/scheduling/bookings/${bookingId}/`, { status: 'CANCELLED' });
        fetchBookings();
      } catch (err) {
        setError('Failed to cancel booking');
      }
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (window.confirm('Delete this cancelled booking permanently? This cannot be undone.')) {
      try {
        await api.delete(`/scheduling/bookings/${bookingId}/`);
        fetchBookings();
      } catch (err) {
        setError('Failed to delete booking');
      }
    }
  };

  if (loading) return <div className="feature-landing loading">Loading bookings...</div>;

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'PENDING').length,
    approved: bookings.filter(b => b.status === 'APPROVED').length,
    rejected: bookings.filter(b => b.status === 'REJECTED').length,
  };

  return (
    <div className="feature-landing">
      <div className="feature-header">
        <div className="feature-title-section">
          <h1>📋 Booking Management</h1>
          <p className="feature-subtitle">Create, modify, cancel bookings • Approve/reject requests • Manage recurring & waitlist</p>
        </div>
        <button className="btn btn-primary" onClick={() => window.location.href = '/admin-scheduling?tab=bookings'}>
          + New Booking
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="feature-stats">
        <div className="stat-card">
          <div className="stat-number">{stats.total}</div>
          <div className="stat-label">Total Bookings</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#ff9800' }}>{stats.pending}</div>
          <div className="stat-label">Pending</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#4caf50' }}>{stats.approved}</div>
          <div className="stat-label">Approved</div>
        </div>
        <div className="stat-card">
          <div className="stat-number" style={{ color: '#f44336' }}>{stats.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      <div className="filters-section">
        <label>Filter by Status:</label>
        <select
          value={filters.status}
          onChange={(e) => setFilters({ status: e.target.value })}
          className="filter-select"
        >
          <option value="ALL">All Bookings</option>
          <option value="PENDING">Pending (Approval)</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      <div className="bookings-table">
        {bookings.length === 0 ? (
          <div className="empty-state">
            <p>No bookings found for the selected filter.</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>User</th>
                <th>Room</th>
                <th>Date</th>
                <th>Time</th>
                <th>Status</th>
                <th>Type</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => (
                <tr key={booking.id}>
                  <td>#{booking.id}</td>
                  <td>{booking.user_name || booking.user}</td>
                  <td>{booking.room_name || 'N/A'}</td>
                  <td>{new Date(booking.booking_date).toLocaleDateString()}</td>
                  <td>{booking.start_time} - {booking.end_time}</td>
                  <td><span className={`status-badge ${booking.status.toLowerCase()}`}>{booking.status}</span></td>
                  <td>{booking.is_recurring ? '🔄 Recurring' : 'Single'}</td>
                  <td className="actions-cell">
                    {booking.status === 'PENDING' && (
                      <>
                        <button
                          className="btn btn-sm btn-success"
                          onClick={() => handleApproveBooking(booking.id)}
                        >
                          Approve
                        </button>
                        <button
                          className="btn btn-sm btn-danger"
                          onClick={() => handleRejectBooking(booking.id)}
                        >
                          Reject
                        </button>
                      </>
                    )}
                    {booking.status === 'APPROVED' && (
                      <button
                        className="btn btn-sm btn-warning"
                        onClick={() => handleCancelBooking(booking.id)}
                      >
                        Cancel
                      </button>
                    )}
                    {booking.status === 'CANCELLED' && (
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteBooking(booking.id)}
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="feature-info">
        <h3>Booking Features</h3>
        <div className="feature-grid">
          <div className="feature-item">
            <h4>✅ Approval Management</h4>
            <p>Review and approve pending booking requests</p>
          </div>
          <div className="feature-item">
            <h4>🔄 Recurring Bookings</h4>
            <p>Manage bookings that repeat on a schedule</p>
          </div>
          <div className="feature-item">
            <h4>⚠️ Conflict Override</h4>
            <p>Override rules when necessary with admin privileges</p>
          </div>
          <div className="feature-item">
            <h4>📌 Waitlist Management</h4>
            <p>Prioritize and manage waitlisted bookings</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingsLanding;
