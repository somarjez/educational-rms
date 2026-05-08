import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { getBookings } from '../../services/schedulingApi';
import QuickBookingApproval from '../../features/dashboard/admin/QuickBookingApproval';
import {
  extractEquipmentRequestDetails,
  isEquipmentRequestBooking,
} from '../../features/equipmentRequest/equipmentRequestUtils';
import './LandingPages.css';

const PAGE_SIZE = 20;
const toList = (data) => (Array.isArray(data) ? data : data?.results || []);

const AdminEquipmentRequestsPage = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);

  const loadRequests = useCallback(async (pageNum = 1) => {
    try {
      setLoading(true);
      const response = await getBookings({
        status: 'PENDING',
        is_equipment_request: true,
        page: pageNum,
        page_size: PAGE_SIZE,
      });
      setBookings(toList(response));
      setTotalCount(response?.count ?? toList(response).length);
      setHasNext(!!response?.next);
      setError('');
    } catch (err) {
      setBookings([]);
      setError('Failed to load equipment requests.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests(page);
  }, [loadRequests, page]);

  const pendingCount = useMemo(() => totalCount, [totalCount]);

  const handleApproved = (id) => {
    setBookings((prev) => prev.filter((item) => item.id !== id));
    setTotalCount((prev) => Math.max(0, prev - 1));
  };

  const handleRejected = (id) => {
    setBookings((prev) => prev.filter((item) => item.id !== id));
    setTotalCount((prev) => Math.max(0, prev - 1));
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
        <>
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
          {(page > 1 || hasNext) && (
            <div className="pagination-controls" style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', alignItems: 'center' }}>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
              >
                Previous
              </button>
              <span>Page {page}</span>
              <button
                type="button"
                className="btn btn-secondary"
                disabled={!hasNext}
                onClick={() => setPage((p) => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminEquipmentRequestsPage;
