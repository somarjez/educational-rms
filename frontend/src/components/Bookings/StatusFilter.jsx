import React from 'react';

const StatusFilter = ({ filterStatus, setFilterStatus }) => (
  <div className="filter-section">
    <label>Filter by Status:</label>
    <div className="status-buttons">
      <button
        className={`status-filter-btn ${filterStatus === '' ? 'active' : ''}`}
        onClick={() => setFilterStatus('')}
      >
        All
      </button>
      {['PENDING', 'APPROVED', 'REJECTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'].map(status => (
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

export default StatusFilter;
