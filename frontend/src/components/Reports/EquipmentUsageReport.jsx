import React from 'react';

const formatDate = (value) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

const EquipmentUsageReport = ({ rows }) => {
  if (!rows.length) {
    return <div className="empty-state">No equipment usage data found for selected filters.</div>;
  }

  return (
    <div className="reports-table-wrapper">
      <table className="reports-table">
        <thead>
          <tr>
            <th>Equipment</th>
            <th>Requests</th>
            <th>Requested Qty</th>
            <th>Approved Qty</th>
            <th>Pending Qty</th>
            <th>Available Quantity</th>
            <th>Last Used</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.equipmentId}>
              <td>{row.equipmentName}</td>
              <td>{row.timesUsed}</td>
              <td>{row.requestedQuantity ?? 0}</td>
              <td>{row.approvedQuantity ?? 0}</td>
              <td>{row.pendingQuantity ?? 0}</td>
              <td>{row.availableQuantity ?? 'N/A'}</td>
              <td>{formatDate(row.lastUsed)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default EquipmentUsageReport;
