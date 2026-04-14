import React from 'react';
import { FiClock, FiRefreshCw } from 'react-icons/fi';
import SectionCard from '../SectionCard';
import SimulationHistoryTable from '../SimulationHistoryTable';

const HistorySection = ({
  historyLoading,
  onRefresh,
  runs,
  currentPage,
  totalPages,
  onPrev,
  onNext,
  onLoadRun,
  onExportRun,
}) => {
  return (
    <SectionCard
      title={<><FiClock /> Simulation History</>}
      actions={(
        <button className="btn-export" type="button" onClick={onRefresh} disabled={historyLoading}>
          <FiRefreshCw /> {historyLoading ? 'Refreshing...' : 'Refresh History'}
        </button>
      )}
    >
      <SimulationHistoryTable
        runs={runs}
        currentPage={currentPage}
        totalPages={totalPages}
        onPrev={onPrev}
        onNext={onNext}
        onLoadRun={onLoadRun}
        onExportRun={onExportRun}
      />
    </SectionCard>
  );
};

export default HistorySection;
