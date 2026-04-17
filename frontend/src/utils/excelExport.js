import ExcelJS from 'exceljs';

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
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Educational RMS';
  workbook.created = new Date();

  const overviewSheet = workbook.addWorksheet('Overview');
  overviewSheet.columns = [{ width: 24 }, { width: 44 }];
  overviewSheet.addRow(['Report Overview', '']);
  overviewSheet.addRows(buildOverviewRows({ activeTab, filters, summary: reports?.summary, filterOptions }));
  overviewSheet.getRow(1).font = { bold: true };

  const dataSheetInfo = buildDataSheet({ activeTab, reports, canViewUserActivity });
  const dataSheet = workbook.addWorksheet(sanitizeSheetName(dataSheetInfo.sheetName));
  dataSheet.columns = dataSheetInfo.header.map((header) => ({
    width: Math.max(String(header).length + 2, 16),
  }));
  dataSheet.addRow(dataSheetInfo.header);
  dataSheet.addRows(dataSheetInfo.rows);
  dataSheet.getRow(1).font = { bold: true };

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(downloadUrl), 0);
};

export default exportReportsToExcel;