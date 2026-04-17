import React from 'react';
import QuickBookingApproval from '../QuickBookingApproval';

const PendingRequestsList = ({ requests, onApproved, onRejected }) => (
  <div className="pending-requests-list">
    {requests.map((request) => (
      <QuickBookingApproval
        key={request.id}
        booking={request}
        onApproved={onApproved}
        onRejected={onRejected}
      />
    ))}
  </div>
);

export default PendingRequestsList;
