import React from 'react';
import { useNavigate } from 'react-router-dom';
import BookingManagement from '../../components/Admin/BookingManagement/BookingManagement';

const PendingApprovalRequestsPage = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.35rem', color: '#1e293b' }}>Pending Approval Requests</h1>
          <p style={{ margin: '0.35rem 0 0', color: '#64748b' }}>
            Review pending booking requests and approve or reject each request.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          style={{ border: '1px solid #2563eb', background: '#fff', color: '#2563eb', borderRadius: '8px', padding: '0.45rem 0.9rem', cursor: 'pointer' }}
        >
          Back to Dashboard
        </button>
      </div>

      <BookingManagement initialStatus="PENDING" heading="Pending Booking Requests" showCreateButton={false} />
    </div>
  );
};

export default PendingApprovalRequestsPage;
