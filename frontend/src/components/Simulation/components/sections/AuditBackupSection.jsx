import React from 'react';
import { FiDownload, FiRefreshCw } from 'react-icons/fi';
import SectionCard from '../SectionCard';
import AuditLogsTable from '../AuditLogsTable';

const AuditBackupSection = ({
  isAuditLoading,
  isBackupLoading,
  onRefreshLogs,
  onBackupSummary,
  onBackupFull,
  logs,
  currentPage,
  totalPages,
  onPrev,
  onNext,
}) => {
  return (
    <SectionCard
      title="Audit Logs & Backup"
      actions={(
        <div className="cartoon-controls">
          <button className="btn-export" type="button" onClick={onRefreshLogs} disabled={isAuditLoading}>
            <FiRefreshCw /> {isAuditLoading ? 'Loading Logs...' : 'Refresh Logs'}
          </button>
          <button className="btn-export" type="button" onClick={onBackupSummary} disabled={isBackupLoading}>
            <FiDownload /> {isBackupLoading ? 'Exporting...' : 'Backup (Summary)'}
          </button>
          <button className="btn-export" type="button" onClick={onBackupFull} disabled={isBackupLoading}>
            <FiDownload /> {isBackupLoading ? 'Exporting...' : 'Backup (Full)'}
          </button>
        </div>
      )}
    >
      <AuditLogsTable
        logs={logs}
        currentPage={currentPage}
        totalPages={totalPages}
        onPrev={onPrev}
        onNext={onNext}
      />
    </SectionCard>
  );
};

export default AuditBackupSection;
