import React from 'react';
import { getTotalParticipants } from '../utils/bookingViewUtils';

const BookingsSummaryStats = ({ bookings }) => {
  return (
    <div className="summary-stats">
      <div className="stat-card">
        <div className="stat-value">{bookings.length}</div>
        <div className="stat-label">Total Bookings</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{getTotalParticipants(bookings)}</div>
        <div className="stat-label">Total Participants</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{bookings.filter((booking) => booking.is_recurring).length}</div>
        <div className="stat-label">Recurring Bookings</div>
      </div>
    </div>
  );
};

export default BookingsSummaryStats;
