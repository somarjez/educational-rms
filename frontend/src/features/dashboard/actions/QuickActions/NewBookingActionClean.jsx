import React from 'react';
import { FiCalendar } from 'react-icons/fi';

const buttonStyle = { background: '#f8e271', color: '#ffffff' };
const iconStyle = { background: 'rgba(255, 255, 255, 0.22)' };
const titleStyle = { color: '#ffffff' };
const descriptionStyle = { color: '#4c8fe8' };

const NewBookingActionClean = ({ onClick }) => (
  <button className="action-btn" onClick={onClick} type="button" style={buttonStyle}>
    <div className="action-icon" style={iconStyle}>
      <FiCalendar />
    </div>
    <div className="action-text">
      <div className="action-title" style={titleStyle}>New Booking</div>
      <div className="action-description" style={descriptionStyle}>Reserve a resource</div>
    </div>
  </button>
);

export default NewBookingActionClean;
