import React from 'react';

const DateDisplay = ({ selectedDate }) => (
  <div className="today-date">
    <div className="date-icon">📅</div>
    <div className="date-info">
      <p className="date-day">{selectedDate.toLocaleDateString('en-US', { weekday: 'long' })}</p>
      <p className="date-full">{selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
    </div>
  </div>
);

export default DateDisplay;
