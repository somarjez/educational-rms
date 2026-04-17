import React from 'react';

const BookingsStats = ({ bookings }) => {
  return (
    <div className="summary-stats">
      <div className="stat-card">
        <div className="stat-value">{bookings.length}</div>
        <div className="stat-label">Total Bookings</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{bookings.filter(b => b.participants_count).reduce((sum, b) => sum + b.participants_count, 0)}</div>
        <div className="stat-label">Total Participants</div>
      </div>
      <div className="stat-card">
        <div className="stat-value">{bookings.filter(b => b.is_recurring).length}</div>
        <div className="stat-label">Recurring Bookings</div>
      </div>
    </div>
  );
};

export default BookingsStats;
