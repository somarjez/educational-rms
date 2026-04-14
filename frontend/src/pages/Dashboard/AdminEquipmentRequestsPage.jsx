import React, { useEffect, useMemo, useState } from 'react';
import { getBookings } from '../../services/schedulingApi';
import QuickBookingApproval from '../../features/dashboard/admin/QuickBookingApproval';
import {
  extractEquipmentRequestDetails,
  isEquipmentRequestBooking,
} from '../../features/equipmentRequest/equipmentRequestUtils';
import './LandingPages.css';

const toList = (data) => (Array.isArray(data) ? data : data?.results || []);

const AdminEquipmentRequestsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await getBookings({ status: 'PENDING', page_size: 300 });
      setBookings(toList(response).filter(isEquipmentRequestBooking));
      setError('');
    } catch (err) {
      setBookings([]);
      setError('Failed to load equipment requests.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const pendingCount = useMemo(() => bookings.length, [bookings]);

  const handleApproved = (id) => {
    setBookings((prev) => prev.filter((item) => item.id !== id));
  };

  const handleRejected = (id) => {
    setBookings((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="landing-page">
      <div className="landing-header">
        <div>
          <h1 className="landing-title">Equipment Requests</h1>
          <p className="landing-subtitle">Review and manage submitted equipment requests</p>
        </div>
      </div>

      <div className="landing-grid">
        <div className="landing-stat">
          <div className="landing-stat-label">Pending Equipment Requests</div>
          <div className="landing-stat-value">{pendingCount}</div>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading equipment requests...</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : bookings.length === 0 ? (
        <div className="empty-state">No pending equipment requests.</div>
      ) : (
        <div className="pending-requests-container">
          {bookings.map((booking) => {
            const details = extractEquipmentRequestDetails(booking);
            return (
              <div key={booking.id}>
                <div className="landing-subtitle" style={{ marginBottom: '0.5rem' }}>
                  Equipment: {details.equipmentName} | Quantity: {details.quantity}
                </div>
                <QuickBookingApproval
                  booking={booking}
                  onApproved={() => handleApproved(booking.id)}
                  onRejected={() => handleRejected(booking.id)}
                />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default AdminEquipmentRequestsPage;
