import React from 'react';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

const UserActivityReport = ({ rows, canViewUserActivity }) => {
  if (!canViewUserActivity) {
    return (
      <div className="empty-state">
        User activity report is not available for your role with current backend permissions.
      </div>
    );
  }

  if (!rows.length) {
    return <div className="empty-state">No user activity data found for selected filters.</div>;
  }

  return (
    <div className="reports-table-wrapper">
      <table className="reports-table">
        <thead>
          <tr>
            <th>User</th>
            <th>Role</th>
            <th>Bookings Created</th>
            <th>Approved</th>
            <th>Cancelled</th>
            <th>Rejected</th>
            <th>Last Activity</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.userId}>
              <td>{row.userName}</td>
              <td>{row.role || 'N/A'}</td>
              <td>{row.bookingsCreated}</td>
              <td>{row.approvedCount}</td>
              <td>{row.cancelledCount}</td>
              <td>{row.rejectedCount}</td>
              <td>{formatDate(row.lastActivity)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UserActivityReport;
