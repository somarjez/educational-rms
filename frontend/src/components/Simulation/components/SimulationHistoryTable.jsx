import React from 'react';
import { FiDownload } from 'react-icons/fi';
import PaginationToolbar from './PaginationToolbar';

const SimulationHistoryTable = ({
  runs,
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onLoadRun,
  onExportRun,
}) => {
  if (!runs.length) {
    return <p className="empty-state">No saved simulation runs yet. Run a simulation to build history.</p>;
  }

  return (
    <>
      <div className="timeline-table-wrap">
        <table className="timeline-table">
          <thead>
            <tr>
              <th>Run Date</th>
              <th>Scenario</th>
              <th>Utilization</th>
              <th>Avg Wait</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id}>
                <td>{new Date(run.run_date).toLocaleString()}</td>
                <td>{run.scenario_name}</td>
                <td className="value numeric">{Number((run.metrics?.server_utilization || 0) * 100).toFixed(1)}%</td>
                <td className="value numeric">{Number(run.metrics?.avg_waiting_time || 0).toFixed(2)}h</td>
                <td>
                  <div className="cartoon-controls">
                    <button className="btn-export" type="button" onClick={() => onLoadRun(run)}>
                      Load
                    </button>
                    <button className="btn-export" type="button" onClick={() => onExportRun(run)}>
                      <FiDownload /> Export
                    </button>
                  </div>
                </td>
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

export default SimulationHistoryTable;
