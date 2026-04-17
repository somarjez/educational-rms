import React, { useState } from 'react';
import { approveBooking, rejectBooking } from '../../../services/schedulingApi';
import AlertModal from '../../../components/Common/Modal/AlertModal';
import '../core/styles/Dashboard.css';

const QuickBookingApproval = ({ booking, onApproved, onRejected }) => {
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const timeLabel = booking?.time || (
    booking?.time_slot_details?.start_time && booking?.time_slot_details?.end_time
      ? `${booking.time_slot_details.start_time} - ${booking.time_slot_details.end_time}`
      : 'N/A'
  );

  const handleApprove = async () => {
    setLoading(true);
    try {
      await approveBooking(booking.id);
      onApproved(booking.id);
    } catch (error) {
      console.error('Failed to approve booking:', error);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to approve booking',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setAlertModal({
        isOpen: true,
        title: 'Required Field',
        message: 'Please provide a reason for rejection',
        type: 'warning'
      });
      return;
    }

    setLoading(true);
    try {
      await rejectBooking(booking.id, rejectionReason);
      onRejected(booking.id);
      setShowRejectModal(false);
      setRejectionReason('');
    } catch (error) {
      console.error('Failed to reject booking:', error);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to reject booking',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="pending-request-card">
        <div className="request-header">
          <div className="request-user">
            <div className="user-icon">👤</div>
            <div>
              <p className="request-user-name">{booking.user_name}</p>
              <p className="request-room">{booking.room_name}</p>
            </div>
          </div>
          <span className={`priority-badge ${booking.priority.toLowerCase()}`}>
            {booking.priority}
          </span>
        </div>
        <div className="request-details">
          <p className="request-date">
            📅 {new Date(booking.date).toLocaleDateString('en-US', { 
              month: 'short', 
              day: 'numeric', 
              year: 'numeric' 
            })}
          </p>
          <p className="request-time">⏰ {timeLabel}</p>
        </div>
        <p className="request-purpose">{booking.purpose}</p>
        <div className="request-actions">
          <button 
            className="approve-btn-quick"
            onClick={handleApprove}
            disabled={loading}
          >
            ✓ Approve
          </button>
          <button 
            className="reject-btn-quick"
            onClick={() => setShowRejectModal(true)}
            disabled={loading}
          >
            ✗ Reject
          </button>
        </div>
      </div>

      {/* Rejection Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(false)}>
          <div className="modal-content-small" onClick={(e) => e.stopPropagation()}>
            <h3>Reject Booking Request</h3>
            <p className="modal-description">Please provide a reason for rejecting this booking:</p>
            <textarea
              className="rejection-textarea"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Enter rejection reason..."
              rows="4"
            />
            <div className="modal-actions">
              <button 
                className="modal-btn-secondary"
                onClick={() => setShowRejectModal(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                className="modal-btn-danger"
                onClick={handleReject}
                disabled={loading || !rejectionReason.trim()}
              >
                {loading ? 'Rejecting...' : 'Reject Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};

export default QuickBookingApproval;
