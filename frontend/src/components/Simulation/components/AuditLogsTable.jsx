import React from 'react';
import PaginationToolbar from './PaginationToolbar';

const AuditLogsTable = ({
  logs,
  currentPage,
  totalPages,
  onPrev,
  onNext,
}) => {
  if (!logs.length) {
    return <p className="empty-state">No audit logs yet. Run a simulation or export backup to generate logs.</p>;
  }

  return (
    <>
      <div className="timeline-table-wrap">
        <table className="timeline-table">
          <thead>
            <tr>
              <th>When</th>
              <th>Action</th>
              <th>Level</th>
              <th>Scenario</th>
              <th>Message</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{new Date(log.created_at).toLocaleString()}</td>
                <td>{log.action}</td>
                <td className="value">{log.level}</td>
                <td>{log.scenario_name || '-'}</td>
                <td>{log.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <PaginationToolbar
        className="timeline-toolbar-padded"
        currentPage={currentPage}
        totalPages={totalPages}
        onPrev={onPrev}
        onNext={onNext}
      />
    </>
  );
};

export default AuditLogsTable;
