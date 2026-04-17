import React from 'react';

const NewBookingAction = ({ onClick }) => (
  <button className="action-btn" onClick={onClick}>
    <div className="action-icon">📅</div>
    <div className="action-text">
      <div className="action-title">New Booking</div>
      <div className="action-description">Reserve a resource</div>
    </div>
  </button>
);

export default NewBookingAction;
