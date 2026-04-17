import React from 'react';

const BookingCard = ({ booking, onViewDetails }) => {
  return (
    <div className="booking-card">
      <div className="booking-header">
        <div className="booking-course">
          <span className="course-code">{booking.notes?.split(': ')[1] || booking.purpose || 'N/A'}</span>
          {booking.is_recurring && (
            <span className="badge-recurring">Recurring</span>
          )}
        </div>
        <span className={`status-badge status-${booking.status.toLowerCase()}`}>
          {booking.status}
        </span>
      </div>
      <div className="booking-details">
        <div className="detail-row">
          <span className="detail-label">Instructor:</span>
          <span className="detail-value">{booking.user_name || booking.user_email || 'N/A'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Date:</span>
          <span className="detail-value">{booking.date}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Time:</span>
          <span className="detail-value">{booking.time_slot_details ? `${booking.time_slot_details.start_time} - ${booking.time_slot_details.end_time}` : 'N/A'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Room:</span>
          <span className="detail-value">{booking.room_name || 'N/A'}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Participants:</span>
          <span className="detail-value">{booking.participants_count || 0}</span>
        </div>
      </div>
      <div className="booking-footer">
        <div className="priority-indicator" title={`Priority: ${booking.priority}`}>{booking.priority}</div>
        <button className="btn-view" onClick={() => onViewDetails(booking)}>View Details</button>
      </div>
    </div>
  );
};

export default BookingCard;
