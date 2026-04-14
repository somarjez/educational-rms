import React, { useEffect, useState } from 'react';
import { getBookings } from '../../services/schedulingApi';
import QuickBookingApproval from '../../features/dashboard/admin/QuickBookingApproval';
import './LandingPages.css';

const toList = (data) => (Array.isArray(data) ? data : data?.results || []);

const PendingRequestsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const pendingRequests = bookings.filter(
    (b) => String(b?.status || '').toUpperCase() === 'PENDING'
  );

  const fetchPendingBookings = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await getBookings({ status: 'PENDING', page_size: 100 });
      setBookings(toList(data));
      setError('');
    } catch (err) {
      setBookings([]);
      setError('Failed to load pending requests.');
      console.error('Error fetching pending bookings:', err);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const handleApproved = (bookingId) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  const handleRejected = (bookingId) => {
    setBookings((prev) => prev.filter((b) => b.id !== bookingId));
  };

  return (
    <div className="landing-page">
      <div className="landing-header">
        <div>
          <h1 className="landing-title">Pending Requests</h1>
          <p className="landing-subtitle">Review and approve or reject pending booking requests.</p>
        </div>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => fetchPendingBookings(true)}
          disabled={loading || refreshing}
        >
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="landing-grid">
        <div className="landing-stat">
          <div className="landing-stat-label">Total Pending</div>
          <div className="landing-stat-value">{pendingRequests.length}</div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading pending requests...</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : pendingRequests.length === 0 ? (
        <div className="empty-state">No pending requests to review.</div>
      ) : (
        <div className="pending-requests-container">
          {pendingRequests.map((booking) => (
            <div key={booking.id}>
              <div className="landing-subtitle" style={{ marginBottom: '0.5rem' }}>
                Status: {String(booking.status || 'PENDING').toUpperCase()}
              </div>
              <QuickBookingApproval
                booking={booking}
                onApproved={() => handleApproved(booking.id)}
                onRejected={() => handleRejected(booking.id)}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingRequestsPage;
