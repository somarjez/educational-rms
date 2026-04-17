import React from 'react';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

const RoomUsageReport = ({ rows }) => {
  if (!rows.length) {
    return <div className="empty-state">No room usage data found for selected filters.</div>;
  }

  return (
    <div className="reports-table-wrapper">
      <table className="reports-table">
        <thead>
          <tr>
            <th>Room</th>
            <th>Bookings</th>
            <th>Approved</th>
            <th>Pending</th>
            <th>Cancelled</th>
            <th>Total Hours Used</th>
            <th>Last Used</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.roomId}>
              <td>{row.roomName}</td>
              <td>{row.totalBookings}</td>
              <td>{row.approved + row.confirmed}</td>
              <td>{row.pending}</td>
              <td>{row.cancelled}</td>
              <td>{row.totalHoursUsed.toFixed(1)}</td>
              <td>{formatDate(row.lastUsed)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default RoomUsageReport;
