import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { getReportsData } from '../../services/reportsService';
import ReportsFilters from '../../components/Reports/ReportsFilters';
import ReportsTabs from '../../components/Reports/ReportsTabs';
import RoomUsageReport from '../../components/Reports/RoomUsageReport';
import EquipmentUsageReport from '../../components/Reports/EquipmentUsageReport';
import UserActivityReport from '../../components/Reports/UserActivityReport';
import ExportButtons from '../../components/Reports/ExportButtons';
import { exportReportsToExcel } from '../../utils/excelExport';
import { exportElementToPdf } from '../../utils/pdfExport';
import './ReportsPage.css';

const initialFilters = {
  startDate: '',
  endDate: '',
  status: '',
  roomId: '',
  equipmentId: '',
};

const normalizeRole = (role) => String(role || '').toUpperCase();

const ReportsPage = () => {
  const { user } = useAuthStore();
  const exportContainerRef = useRef(null);
  const [activeTab, setActiveTab] = useState('room');
  const [filters, setFilters] = useState(initialFilters);
  const [reports, setReports] = useState({
    roomUsage: [],
    equipmentUsage: [],
    userActivity: [],
    summary: {
      totalRoomBookings: 0,
      totalEquipmentRequests: 0,
      mostUsedRoom: 'N/A',
      mostRequestedEquipment: 'N/A',
      activeUsersThisPeriod: 0,
    },
    filterOptions: {
      rooms: [],
      equipment: [],
    },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportNotice, setExportNotice] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const role = normalizeRole(user?.role);
  const isAdmin = role === 'ADMIN';
  const isFaculty = role === 'FACULTY';

  const canViewUserActivity = isAdmin || isFaculty;
  const canExport = isAdmin || isFaculty;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const payload = await getReportsData({ filters, currentUser: user, activeTab });
        setReports(payload);
        setError('');
      } catch (err) {
        setError('Failed to load reports data from current backend endpoints.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [activeTab, filters, user]);

  const summaryCards = useMemo(
    () => [
      { label: 'Total Room Bookings', value: reports.summary.totalRoomBookings },
      { label: 'Total Equipment Requests', value: reports.summary.totalEquipmentRequests },
      { label: 'Most Used Room', value: reports.summary.mostUsedRoom },
      { label: 'Most Requested Equipment', value: reports.summary.mostRequestedEquipment },
      { label: 'Active Users This Period', value: reports.summary.activeUsersThisPeriod },
    ],
    [reports.summary]
  );

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleExport = async (format, reportType) => {
    setExportNotice('');

    if (!canExport) {
      setExportNotice('Export is not allowed for your role based on current backend behavior.');
      return;
    }

    setIsExporting(true);
    try {
      if (format === 'excel') {
        await exportReportsToExcel({
          activeTab: reportType,
          reports,
          filters,
          filterOptions: reports.filterOptions,
          canViewUserActivity,
          fileName: `${reportType}_report_${new Date().toISOString().slice(0, 10)}.xlsx`,
        });
        setExportNotice('Export Excel completed.');
      } else {
        await exportElementToPdf({
          element: exportContainerRef.current,
          fileName: `${reportType}_report_${new Date().toISOString().slice(0, 10)}.pdf`,
        });
        setExportNotice('Export PDF completed.');
      }
    } catch (error) {
      setExportNotice('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const renderTabContent = () => {
    if (activeTab === 'room') {
      return <RoomUsageReport rows={reports.roomUsage} />;
    }

    if (activeTab === 'equipment') {
      return <EquipmentUsageReport rows={reports.equipmentUsage} />;
    }

    return (
      <UserActivityReport
        rows={reports.userActivity}
        canViewUserActivity={canViewUserActivity}
      />
    );
  };

  return (
    <div className="reports-page" ref={exportContainerRef}>
      <div className="reports-header">
        <div>
          <h1 className="reports-title">Reports</h1>
          <p className="reports-subtitle">View room, equipment, and activity insights</p>
        </div>
        <ExportButtons
          activeTab={activeTab}
          onExport={handleExport}
          canExport={canExport}
          exportDisabledReason="Export is available only to ADMIN and FACULTY users"
          isExporting={isExporting}
        />
      </div>

      <ReportsFilters
        activeTab={activeTab}
        filters={filters}
        onChange={handleFilterChange}
        roomOptions={reports.filterOptions.rooms}
        equipmentOptions={reports.filterOptions.equipment}
      />

      <ReportsTabs
        activeTab={activeTab}
        onTabChange={setActiveTab}
        canViewUserActivity={canViewUserActivity}
      />

      {exportNotice ? <div className="reports-notice">{exportNotice}</div> : null}

      <div className="reports-summary-grid">
        {summaryCards.map((card) => (
          <div key={card.label} className="reports-summary-card">
            <div className="reports-summary-label">{card.label}</div>
            <div className="reports-summary-value">{card.value}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="empty-state">Loading reports...</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : (
        renderTabContent()
      )}
    </div>
  );
};

export default ReportsPage;
