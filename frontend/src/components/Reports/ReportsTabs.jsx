import React from 'react';

const REPORT_TABS = [
  { key: 'room', label: 'Room Usage' },
  { key: 'equipment', label: 'Equipment Usage' },
  { key: 'activity', label: 'User Activity' },
];

const ReportsTabs = ({ activeTab, onTabChange, canViewUserActivity }) => {
  return (
    <div className="reports-tabs" role="tablist" aria-label="Report categories">
      {REPORT_TABS.filter((tab) => canViewUserActivity || tab.key !== 'activity').map((tab) => (
        <button
          key={tab.key}
          type="button"
          className={`reports-tab ${activeTab === tab.key ? 'active' : ''}`}
          onClick={() => onTabChange(tab.key)}
          role="tab"
          aria-selected={activeTab === tab.key}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default ReportsTabs;
