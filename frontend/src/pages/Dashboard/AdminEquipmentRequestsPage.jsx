import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBookings } from '../../services/schedulingApi';
import { useAuthStore } from '../../stores/authStore';
import QuickBookingApproval from '../../features/dashboard/admin/QuickBookingApproval';
import DashboardHeader from '../../features/dashboard/core/DashboardHeader';
import hourglassIcon from '../../assets/equipment-request/hourglass-simple-medium.svg';
import {
  extractEquipmentRequestDetails,
  isEquipmentRequestBooking,
} from '../../features/equipmentRequest/equipmentRequestUtils';
import './LandingPages.css';

const toList = (data) => (Array.isArray(data) ? data : data?.results || []);

const AdminEquipmentRequestsPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
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

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="admin-equipment-request-dashboard">
      <DashboardHeader
        user={user || { role: 'User' }}
        onLogout={handleLogout}
        onProfileClick={() => navigate('/profile')}
      />

      <div className="admin-equipment-request-page">
        <div className="admin-equipment-request-heading">
          <h1>EQUIPMENT REQUEST</h1>
          <p>Review and manage submitted equipment requests</p>
        </div>

        <div className="equipment-pending-summary">
          <div className="equipment-pending-label">
            <img src={hourglassIcon} alt="" aria-hidden="true" />
            <span>PENDING RESERVATION</span>
          </div>
          <strong>{pendingCount}</strong>
        </div>

        {loading ? (
          <div className="equipment-request-empty-state">Loading equipment requests...</div>
        ) : error ? (
          <div className="equipment-request-empty-state">{error}</div>
        ) : bookings.length === 0 ? (
          <div className="equipment-request-empty-state">No pending equipment requests.</div>
        ) : (
          <div className="equipment-approval-list">
            {bookings.map((booking) => {
              const details = extractEquipmentRequestDetails(booking);
              return (
                <QuickBookingApproval
                  key={booking.id}
                  booking={booking}
                  equipmentDetails={details}
                  variant="equipment-reference"
                  onApproved={() => handleApproved(booking.id)}
                  onRejected={() => handleRejected(booking.id)}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminEquipmentRequestsPage;
