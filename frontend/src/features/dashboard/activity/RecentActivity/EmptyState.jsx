import React from 'react';

const EmptyState = () => (
  <div className="empty-state">
    <div className="empty-state-icon">📭</div>
    <h3 className="empty-state-title">No Recent Activity</h3>
    <p className="empty-state-text">
      Your bookings and activities will appear here.
    </p>
  </div>
);

export default EmptyState;
