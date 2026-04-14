import api from './api';
import { getRooms, getRoom, getEquipment } from './schedulingApi';
import {
  extractEquipmentRequestDetails,
  isEquipmentRequestBooking,
} from '../features/equipmentRequest/equipmentRequestUtils';

const toList = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }
  return [];
};

const normalizeStatus = (status) => String(status || '').toUpperCase();

const dateOnly = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    return value.split('T')[0];
  }
  return null;
};

const parseDate = (value) => {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const toHourDiff = (startTime, endTime) => {
  if (!startTime || !endTime) return 0;

  const [startH, startM] = String(startTime).split(':').map(Number);
  const [endH, endM] = String(endTime).split(':').map(Number);

  if ([startH, startM, endH, endM].some((n) => Number.isNaN(n))) {
    return 0;
  }

  const startMinutes = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;
  const diff = endMinutes - startMinutes;

  return diff > 0 ? diff / 60 : 0;
};

const fetchAllPages = async (url, params = {}) => {
  const rows = [];
  let nextPage = 1;

  while (nextPage) {
    const response = await api.get(url, {
      params: {
        ...params,
        page: nextPage,
        page_size: 100,
      },
    });

    const data = response.data;
    rows.push(...toList(data));

    if (data?.next) {
      nextPage += 1;
    } else {
      nextPage = 0;
    }
  }

  return rows;
};

const fetchUsersMap = async () => {
  try {
    const users = await fetchAllPages('/auth/users/');
    return users.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
  } catch (error) {
    return {};
  }
};

const fetchRoomDetailsMap = async () => {
  const rooms = toList(await getRooms({ is_active: true }));
  const roomDetails = await Promise.all(
    rooms.map(async (room) => {
      try {
        return await getRoom(room.id);
      } catch (error) {
        return room;
      }
    })
  );

  return roomDetails.reduce((acc, room) => {
    acc[room.id] = room;
    return acc;
  }, {});
};

const matchesFilters = (booking, roomDetailsMap, filters) => {
  if (!booking) return false;

  const bookingDate = dateOnly(booking.date);

  if (filters.startDate && bookingDate && bookingDate < filters.startDate) {
    return false;
  }
  if (filters.endDate && bookingDate && bookingDate > filters.endDate) {
    return false;
  }

  if (filters.status && normalizeStatus(filters.status) !== normalizeStatus(booking.status)) {
    return false;
  }

  if (filters.roomId && Number(filters.roomId) !== Number(booking.room)) {
    return false;
  }

  if (filters.equipmentId) {
    let hasEquipment = false;

    if (isEquipmentRequestBooking(booking)) {
      const details = extractEquipmentRequestDetails(booking);
      hasEquipment = Number(details.equipmentId) === Number(filters.equipmentId);
    } else {
      const room = roomDetailsMap[booking.room];
      const equipmentList = Array.isArray(room?.equipment) ? room.equipment : [];
      hasEquipment = equipmentList.some((item) => Number(item.id) === Number(filters.equipmentId));
    }

    if (!hasEquipment) {
      return false;
    }
  }

  return true;
};

const buildRoomUsage = (bookings, roomDetailsMap) => {
  const grouped = {};

  bookings.forEach((booking) => {
    const roomId = booking.room;
    const roomDetails = roomDetailsMap[roomId] || booking.room_details || {};
    const roomName = booking.room_name || roomDetails.name || `Room #${roomId}`;
    const status = normalizeStatus(booking.status);
    const date = dateOnly(booking.date);
    const slot = booking.time_slot_details || {};

    if (!grouped[roomId]) {
      grouped[roomId] = {
        roomId,
        roomName,
        totalBookings: 0,
        approved: 0,
        pending: 0,
        cancelled: 0,
        rejected: 0,
        confirmed: 0,
        totalHoursUsed: 0,
        lastUsed: null,
      };
    }

    const row = grouped[roomId];
    row.totalBookings += 1;
    row.totalHoursUsed += toHourDiff(slot.start_time, slot.end_time);

    if (status === 'APPROVED') row.approved += 1;
    if (status === 'PENDING') row.pending += 1;
    if (status === 'CANCELLED') row.cancelled += 1;
    if (status === 'REJECTED') row.rejected += 1;
    if (status === 'CONFIRMED') row.confirmed += 1;

    if (date) {
      const currentLast = parseDate(row.lastUsed);
      const candidate = parseDate(date);
      if (!currentLast || (candidate && candidate > currentLast)) {
        row.lastUsed = date;
      }
    }
  });

  return Object.values(grouped).sort((a, b) => b.totalBookings - a.totalBookings);
};

const buildEquipmentUsage = (bookings, roomDetailsMap, equipmentList, filters) => {
  const grouped = {};
  const selectedEquipmentId = filters?.equipmentId ? Number(filters.equipmentId) : null;

  equipmentList.forEach((equipment) => {
    if (selectedEquipmentId && Number(equipment.id) !== selectedEquipmentId) {
      return;
    }
    grouped[equipment.id] = {
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      timesUsed: 0,
      approved: 0,
      pending: 0,
      rejected: 0,
      requestedQuantity: 0,
      approvedQuantity: 0,
      pendingQuantity: 0,
      availableQuantity: equipment.available_quantity,
      lastUsed: null,
    };
  });

  bookings.forEach((booking) => {
    if (!isEquipmentRequestBooking(booking)) {
      return;
    }

    const details = extractEquipmentRequestDetails(booking);
    const rawEquipmentId = details.equipmentId;
    const rawQuantity = Number(details.quantity || 0);
    const bookingEquipmentId = rawEquipmentId ? Number(rawEquipmentId) : null;
    const quantity = Number.isFinite(rawQuantity) && rawQuantity > 0 ? rawQuantity : 0;
    const bookingStatus = normalizeStatus(booking.status);
    const bookingDate = dateOnly(booking.date);

    if (!bookingEquipmentId) {
      return;
    }

    if (selectedEquipmentId && bookingEquipmentId !== selectedEquipmentId) {
      return;
    }

    if (!grouped[bookingEquipmentId]) {
      grouped[bookingEquipmentId] = {
        equipmentId: bookingEquipmentId,
        equipmentName: details.equipmentName,
        timesUsed: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        requestedQuantity: 0,
        approvedQuantity: 0,
        pendingQuantity: 0,
        availableQuantity: null,
        lastUsed: null,
      };
    }

    const row = grouped[bookingEquipmentId];
    row.equipmentName = row.equipmentName || details.equipmentName;
    row.timesUsed += 1;
    row.requestedQuantity += quantity;

    if (bookingStatus === 'PENDING') {
      row.pending += 1;
      row.pendingQuantity += quantity;
    }
    if (bookingStatus === 'APPROVED' || bookingStatus === 'CONFIRMED') {
      row.approved += 1;
      row.approvedQuantity += quantity;
    }
    if (bookingStatus === 'REJECTED') {
      row.rejected += 1;
    }

    if (bookingDate) {
      const currentLast = parseDate(row.lastUsed);
      const candidate = parseDate(bookingDate);
      if (!currentLast || (candidate && candidate > currentLast)) {
        row.lastUsed = bookingDate;
      }
    }
  });

  return Object.values(grouped)
    .filter((row) => {
      if (selectedEquipmentId) {
        return Number(row.equipmentId) === selectedEquipmentId;
      }
      return row.timesUsed > 0 || row.availableQuantity != null;
    })
    .sort((a, b) => {
      if (b.requestedQuantity !== a.requestedQuantity) {
        return b.requestedQuantity - a.requestedQuantity;
      }
      return b.timesUsed - a.timesUsed;
    });
};

const buildUserActivity = (bookings, usersMap, currentUser) => {
  const grouped = {};

  bookings.forEach((booking) => {
    const userId = booking.user;
    const userFromMap = usersMap[userId] || {};
    const status = normalizeStatus(booking.status);
    const bookingDate = dateOnly(booking.date);

    if (!grouped[userId]) {
      const fallbackName = booking.user_name || booking.user_email || `User #${userId}`;
      grouped[userId] = {
        userId,
        userName:
          userFromMap.first_name || userFromMap.last_name
            ? `${userFromMap.first_name || ''} ${userFromMap.last_name || ''}`.trim()
            : userFromMap.username || fallbackName,
        role: userFromMap.role || (Number(currentUser?.id) === Number(userId) ? currentUser?.role : 'N/A'),
        bookingsCreated: 0,
        approvedCount: 0,
        cancelledCount: 0,
        rejectedCount: 0,
        pendingCount: 0,
        lastActivity: null,
      };
    }

    const row = grouped[userId];
    row.bookingsCreated += 1;

    if (status === 'APPROVED' || status === 'CONFIRMED') row.approvedCount += 1;
    if (status === 'CANCELLED') row.cancelledCount += 1;
    if (status === 'REJECTED') row.rejectedCount += 1;
    if (status === 'PENDING') row.pendingCount += 1;

    if (bookingDate) {
      const currentLast = parseDate(row.lastActivity);
      const candidate = parseDate(bookingDate);
      if (!currentLast || (candidate && candidate > currentLast)) {
        row.lastActivity = bookingDate;
      }
    }
  });

  return Object.values(grouped).sort((a, b) => b.bookingsCreated - a.bookingsCreated);
};

export const getReportsData = async ({ filters, currentUser, activeTab }) => {
  const effectiveFilters = {
    ...filters,
    roomId: activeTab === 'room' ? filters.roomId : '',
    equipmentId: activeTab === 'equipment' ? filters.equipmentId : '',
  };
  const bookingParams = {};

  if (effectiveFilters.startDate) bookingParams.start_date = effectiveFilters.startDate;
  if (effectiveFilters.endDate) bookingParams.end_date = effectiveFilters.endDate;
  if (effectiveFilters.status) bookingParams.status = normalizeStatus(effectiveFilters.status);
  if (effectiveFilters.roomId) bookingParams.room_id = effectiveFilters.roomId;

  const [allBookings, roomDetailsMap, equipmentResponse, usersMap] = await Promise.all([
    fetchAllPages('/scheduling/bookings/', bookingParams),
    fetchRoomDetailsMap(),
    getEquipment({ is_active: true }),
    String(currentUser?.role || '').toUpperCase() === 'ADMIN' ? fetchUsersMap() : Promise.resolve({}),
  ]);

  const equipmentList = toList(equipmentResponse);

  const filteredBookings = allBookings.filter((booking) => matchesFilters(booking, roomDetailsMap, effectiveFilters));

  const roomUsage = buildRoomUsage(filteredBookings, roomDetailsMap);
  const equipmentUsage = buildEquipmentUsage(filteredBookings, roomDetailsMap, equipmentList, effectiveFilters);
  const userActivity = buildUserActivity(filteredBookings, usersMap, currentUser);

  const mostUsedRoom = roomUsage[0] || null;
  const equipmentRequestBookings = filteredBookings.filter(isEquipmentRequestBooking);
  const mostRequestedEquipment = equipmentUsage[0] || null;

  return {
    roomUsage,
    equipmentUsage,
    userActivity,
    summary: {
      totalRoomBookings: filteredBookings.length,
      totalEquipmentRequests: equipmentRequestBookings.length,
      mostUsedRoom: mostUsedRoom?.roomName || 'N/A',
      mostRequestedEquipment: mostRequestedEquipment?.equipmentName || 'N/A',
      activeUsersThisPeriod: userActivity.length,
    },
    filterOptions: {
      rooms: Object.values(roomDetailsMap).map((room) => ({ id: room.id, name: room.name })),
      equipment: equipmentList.map((equipment) => ({ id: equipment.id, name: equipment.name })),
    },
  };
};

const toBackendReportType = (tab) => {
  if (tab === 'equipment') return 'equipment';
  if (tab === 'activity') return 'activity';
  return 'room';
};

const toBackendFormat = (format) => (String(format).toLowerCase() === 'pdf' ? 'pdf' : 'excel');

const triggerFileDownload = (blob, filename) => {
  const blobUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = blobUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(blobUrl);
};

export const exportReport = async ({ reportTab, format, filters }) => {
  const scopedFilters = {
    ...filters,
    roomId: reportTab === 'room' ? filters?.roomId : '',
    equipmentId: reportTab === 'equipment' ? filters?.equipmentId : '',
  };

  const params = {
    report_type: toBackendReportType(reportTab),
    export_format: toBackendFormat(format),
  };

  if (scopedFilters?.startDate) params.start_date = scopedFilters.startDate;
  if (scopedFilters?.endDate) params.end_date = scopedFilters.endDate;
  if (scopedFilters?.status) params.status = normalizeStatus(scopedFilters.status);
  if (scopedFilters?.roomId) params.room_id = scopedFilters.roomId;
  if (scopedFilters?.equipmentId) params.equipment_id = scopedFilters.equipmentId;

  const response = await api.get('/reports/export/', {
    params,
    responseType: 'blob',
  });

  const contentDisposition = response.headers?.['content-disposition'] || '';
  const filenameMatch = contentDisposition.match(/filename="?([^";]+)"?/i);
  const fallbackExtension = params.export_format === 'pdf' ? 'pdf' : 'csv';
  const filename = filenameMatch?.[1] || `${params.report_type}_report.${fallbackExtension}`;

  const blob = response.data instanceof Blob ? response.data : new Blob([response.data]);
  triggerFileDownload(blob, filename);
};

export const exportCapacityCsv = async ({ date, days = 1, filenamePrefix = 'capacity_utilization' }) => {
  const params = {};
  if (date) params.date = date;
  if (days) params.days = days;

  const response = await api.get('/capacity/export_csv/', { params });
  const csvContent = response?.data?.csv;

  if (!csvContent) {
    throw new Error('No CSV data returned from backend');
  }

  const csvBlob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const fileDate = date || new Date().toISOString().slice(0, 10);
  const filename = `${filenamePrefix}_${fileDate}.csv`;

  triggerFileDownload(csvBlob, filename);
};

export default {
  getReportsData,
  exportReport,
  exportCapacityCsv,
};
