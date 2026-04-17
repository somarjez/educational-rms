import React from 'react';

const ReportsFilters = ({
  activeTab,
  filters,
  onChange,
  roomOptions,
  equipmentOptions,
}) => {
  return (
    <div className="reports-filters">
      <div className="reports-filter-group">
        <label htmlFor="reports-start-date">Start Date</label>
        <input
          id="reports-start-date"
          type="date"
          value={filters.startDate}
          onChange={(event) => onChange('startDate', event.target.value)}
        />
      </div>

      <div className="reports-filter-group">
        <label htmlFor="reports-end-date">End Date</label>
        <input
          id="reports-end-date"
          type="date"
          value={filters.endDate}
          onChange={(event) => onChange('endDate', event.target.value)}
        />
      </div>

      <div className="reports-filter-group">
        <label htmlFor="reports-status">Booking Status</label>
        <select
          id="reports-status"
          value={filters.status}
          onChange={(event) => onChange('status', event.target.value)}
        >
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REJECTED">Rejected</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      {activeTab === 'room' && (
        <div className="reports-filter-group">
          <label htmlFor="reports-room">Room</label>
          <select
            id="reports-room"
            value={filters.roomId}
            onChange={(event) => onChange('roomId', event.target.value)}
          >
            <option value="">All Rooms</option>
            {roomOptions.map((room) => (
              <option key={room.id} value={room.id}>{room.name}</option>
            ))}
          </select>
        </div>
      )}

      {activeTab === 'equipment' && (
        <div className="reports-filter-group">
          <label htmlFor="reports-equipment">Equipment</label>
          <select
            id="reports-equipment"
            value={filters.equipmentId}
            onChange={(event) => onChange('equipmentId', event.target.value)}
          >
            <option value="">All Equipment</option>
            {equipmentOptions.map((equipment) => (
              <option key={equipment.id} value={equipment.id}>{equipment.name}</option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
};

export default ReportsFilters;
