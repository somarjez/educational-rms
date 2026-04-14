import React from 'react';

const ExportButtons = ({
  activeTab,
  onExport,
  canExport,
  exportDisabledReason,
  isExporting,
}) => {
  return (
    <div className="reports-export-actions">
      <button
        type="button"
        className="reports-export-btn"
        disabled={!canExport || isExporting}
        title={!canExport ? exportDisabledReason : 'Export current report as an Excel workbook'}
        onClick={() => onExport('excel', activeTab)}
      >
        Export Excel
      </button>
      <button
        type="button"
        className="reports-export-btn secondary"
        disabled={!canExport || isExporting}
        title={!canExport ? exportDisabledReason : 'Export current report as print-ready PDF'}
        onClick={() => onExport('pdf', activeTab)}
      >
        Export Print PDF
      </button>
    </div>
  );
};

export default ExportButtons;
