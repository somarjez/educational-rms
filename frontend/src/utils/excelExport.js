import * as XLSX from 'xlsx';

const sanitizeSheetName = (value) => String(value || 'Report').replace(/[\\/?*\[\]:]/g, ' ').slice(0, 31);

const formatDate = (value) => {
  if (!value) return 'N/A';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleDateString();
};

const toVisibleValue = (value) => {
  if (value === null || value === undefined || value === '') {
    return 'N/A';
  }
  return value;
};

const resolveOptionLabel = (options, selectedId, emptyLabel) => {
  if (!selectedId) return emptyLabel;
  const selected = options.find((option) => String(option.id) === String(selectedId));
  return selected?.name || String(selectedId);
};

const buildOverviewRows = ({ activeTab, filters, summary, filterOptions }) => {
  return [
    ['Report Type', activeTab === 'equipment' ? 'Equipment Usage' : activeTab === 'activity' ? 'User Activity' : 'Room Usage'],
    ['Start Date', toVisibleValue(filters?.startDate || 'All Dates')],
    ['End Date', toVisibleValue(filters?.endDate || 'All Dates')],
    ['Booking Status', toVisibleValue(filters?.status || 'All')],
    [
      'Room Filter',
      activeTab === 'room'
        ? resolveOptionLabel(filterOptions?.rooms || [], filters?.roomId, 'All Rooms')
        : 'Not applied',
    ],
    [
      'Equipment Filter',
      activeTab === 'equipment'
        ? resolveOptionLabel(filterOptions?.equipment || [], filters?.equipmentId, 'All Equipment')
        : 'Not applied',
    ],
    ['Total Room Bookings', summary?.totalRoomBookings ?? 0],
    ['Total Equipment Requests', summary?.totalEquipmentRequests ?? 0],
    ['Most Used Room', summary?.mostUsedRoom || 'N/A'],
    ['Most Requested Equipment', summary?.mostRequestedEquipment || 'N/A'],
    ['Active Users This Period', summary?.activeUsersThisPeriod ?? 0],
  ];
};

const buildDataSheet = ({ activeTab, reports, canViewUserActivity }) => {
  if (activeTab === 'equipment') {
    const rows = (reports?.equipmentUsage || []).map((row) => [
      row.equipmentName,
      row.timesUsed ?? 0,
      row.requestedQuantity ?? 0,
      row.approvedQuantity ?? 0,
      row.pendingQuantity ?? 0,
      row.availableQuantity ?? 'N/A',
      formatDate(row.lastUsed),
    ]);

    return {
      sheetName: 'Equipment Usage',
      header: ['Equipment', 'Requests', 'Requested Qty', 'Approved Qty', 'Pending Qty', 'Available Quantity', 'Last Used'],
      rows,
    };
  }

  if (activeTab === 'activity') {
    const rows = (reports?.userActivity || []).map((row) => [
      row.userName,
      row.role || 'N/A',
      row.bookingsCreated ?? 0,
      row.approvedCount ?? 0,
      row.cancelledCount ?? 0,
      row.rejectedCount ?? 0,
      formatDate(row.lastActivity),
    ]);

    return {
      sheetName: 'User Activity',
      header: ['User', 'Role', 'Bookings Created', 'Approved', 'Cancelled', 'Rejected', 'Last Activity'],
      rows: canViewUserActivity ? rows : [],
    };
  }

  const rows = (reports?.roomUsage || []).map((row) => [
    row.roomName,
    row.totalBookings ?? 0,
    (row.approved ?? 0) + (row.confirmed ?? 0),
    row.pending ?? 0,
    row.cancelled ?? 0,
    Number.parseFloat(Number(row.totalHoursUsed || 0).toFixed(1)),
    formatDate(row.lastUsed),
  ]);

  return {
    sheetName: 'Room Usage',
    header: ['Room', 'Bookings', 'Approved', 'Pending', 'Cancelled', 'Total Hours Used', 'Last Used'],
    rows,
  };
};

export const exportReportsToExcel = async ({
  activeTab,
  reports,
  filters,
  filterOptions,
  canViewUserActivity,
  fileName = 'report.xlsx',
}) => {
  const workbook = XLSX.utils.book_new();
  const overviewSheet = XLSX.utils.aoa_to_sheet([
    ['Report Overview', ''],
    ...buildOverviewRows({ activeTab, filters, summary: reports?.summary, filterOptions }),
  ]);

  overviewSheet['!cols'] = [{ wch: 24 }, { wch: 44 }];
  XLSX.utils.book_append_sheet(workbook, overviewSheet, 'Overview');

  const dataSheetInfo = buildDataSheet({ activeTab, reports, canViewUserActivity });
  const dataSheet = XLSX.utils.aoa_to_sheet([dataSheetInfo.header, ...dataSheetInfo.rows]);
  dataSheet['!cols'] = dataSheetInfo.header.map((header) => ({ wch: Math.max(String(header).length + 2, 16) }));
  XLSX.utils.book_append_sheet(workbook, dataSheet, sanitizeSheetName(dataSheetInfo.sheetName));

  XLSX.writeFile(workbook, fileName, { bookType: 'xlsx' });
};

export default exportReportsToExcel;