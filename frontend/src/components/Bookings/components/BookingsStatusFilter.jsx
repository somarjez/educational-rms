import React from 'react';
import { BOOKING_STATUS_OPTIONS } from '../constants/statusOptions';

const BookingsStatusFilter = ({ filterStatus, setFilterStatus }) => {
  return (
    <div className="filter-section">
      <label>Filter by Status:</label>
      <div className="status-buttons">
        <button
          className={`status-filter-btn ${filterStatus === '' ? 'active' : ''}`}
          onClick={() => setFilterStatus('')}
        >
          All
        </button>
        {BOOKING_STATUS_OPTIONS.map((status) => (
          <button
            key={status}
            className={`status-filter-btn ${filterStatus === status ? 'active' : ''}`}
            onClick={() => setFilterStatus(status)}
          >
            {status}
          </button>
        ))}
      </div>
    </div>
  );
};

export default BookingsStatusFilter;
