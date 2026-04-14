/**
 * Scheduling API Service
 * Handles all API calls for scheduling and resource management
 */

import api from './api';

// ============== ROOMS ==============

export const getRooms = async (params = {}) => {
  const response = await api.get('/scheduling/rooms/', { params });
  return response.data;
};

export const getRoom = async (id) => {
  const response = await api.get(`/scheduling/rooms/${id}/`);
  return response.data;
};

export const createRoom = async (data) => {
  const response = await api.post('/scheduling/rooms/', data);
  return response.data;
};

export const updateRoom = async (id, data) => {
  const response = await api.put(`/scheduling/rooms/${id}/`, data);
  return response.data;
};

export const partialUpdateRoom = async (id, data) => {
  const response = await api.patch(`/scheduling/rooms/${id}/`, data);
  return response.data;
};

export const deleteRoom = async (id) => {
  const response = await api.delete(`/scheduling/rooms/${id}/`);
  return response.data;
};

export const getRoomAvailability = async (roomId, date) => {
  const response = await api.get(`/scheduling/rooms/${roomId}/availability/`, {
    params: { date }
  });
  return response.data;
};

export const addEquipmentToRoom = async (roomId, equipmentIds) => {
  const response = await api.post(`/scheduling/rooms/${roomId}/add_equipment/`, {
    equipment_ids: equipmentIds
  });
  return response.data;
};

export const removeEquipmentFromRoom = async (roomId, equipmentIds) => {
  const response = await api.post(`/scheduling/rooms/${roomId}/remove_equipment/`, {
    equipment_ids: equipmentIds
  });
  return response.data;
};

// ============== EQUIPMENT ==============

export const getEquipment = async (params = {}) => {
  const response = await api.get('/scheduling/equipment/', { params });
  return response.data;
};

export const getEquipmentItem = async (id) => {
  const response = await api.get(`/scheduling/equipment/${id}/`);
  return response.data;
};

export const createEquipment = async (data) => {
  const response = await api.post('/scheduling/equipment/', data);
  return response.data;
};

export const updateEquipment = async (id, data) => {
  const response = await api.put(`/scheduling/equipment/${id}/`, data);
  return response.data;
};

export const deleteEquipment = async (id) => {
  const response = await api.delete(`/scheduling/equipment/${id}/`);
  return response.data;
};

// ============== TIME SLOTS ==============

export const getTimeSlots = async (params = {}) => {
  const response = await api.get('/scheduling/timeslots/', { params });
  return response.data;
};

export const getTimeSlot = async (id) => {
  const response = await api.get(`/scheduling/timeslots/${id}/`);
  return response.data;
};

export const createTimeSlot = async (data) => {
  const response = await api.post('/scheduling/timeslots/', data);
  return response.data;
};

export const updateTimeSlot = async (id, data) => {
  const response = await api.put(`/scheduling/timeslots/${id}/`, data);
  return response.data;
};

export const deleteTimeSlot = async (id) => {
  const response = await api.delete(`/scheduling/timeslots/${id}/`);
  return response.data;
};

// ============== BOOKINGS ==============

export const getBookings = async (params = {}) => {
  const response = await api.get('/scheduling/bookings/', { params });
  return response.data;
};

export const getBooking = async (id) => {
  const response = await api.get(`/scheduling/bookings/${id}/`);
  return response.data;
};

export const createBooking = async (data) => {
  const response = await api.post('/scheduling/bookings/', data);
  return response.data;
};

export const updateBooking = async (id, data) => {
  const response = await api.put(`/scheduling/bookings/${id}/`, data);
  return response.data;
};

export const partialUpdateBooking = async (id, data) => {
  const response = await api.patch(`/scheduling/bookings/${id}/`, data);
  return response.data;
};

export const deleteBooking = async (id) => {
  const response = await api.delete(`/scheduling/bookings/${id}/`);
  return response.data;
};

export const approveBooking = async (id, notes = '') => {
  const response = await api.post(`/scheduling/bookings/${id}/approve/`, { notes });
  return response.data;
};

export const rejectBooking = async (id, notes = '') => {
  const response = await api.post(`/scheduling/bookings/${id}/reject/`, { notes });
  return response.data;
};

export const cancelBooking = async (id, data = {}) => {
  const response = await api.post(`/scheduling/bookings/${id}/cancel/`, data);
  return response.data;
};

export const modifyBooking = async (id, data = {}) => {
  const response = await api.post(`/scheduling/bookings/${id}/modify/`, data);
  return response.data;
};

export const getBookingHistory = async (params = {}) => {
  const response = await api.get('/scheduling/bookings/history/', { params });
  return response.data;
};

export const overrideConflict = async (id, overrideReason) => {
  const response = await api.post(`/scheduling/bookings/${id}/override_conflict/`, {
    override_reason: overrideReason
  });
  return response.data;
};

export const bulkCancelBookings = async (bookingIds, notes = '') => {
  const response = await api.post('/scheduling/bookings/bulk_cancel/', {
    booking_ids: bookingIds,
    notes
  });
  return response.data;
};

export const bulkDeleteBookings = async (bookingIds) => {
  const response = await api.post('/scheduling/bookings/bulk_delete/', {
    booking_ids: bookingIds
  });
  return response.data;
};

export const getCalendarEvents = async (startDate, endDate, roomIds = []) => {
  const params = {
    start_date: startDate,
    end_date: endDate,
  };

  // Send all room IDs when provided - convert to comma-separated string
  if (roomIds && roomIds.length > 0) {
    params.room_ids = roomIds.join(',');
    console.log('Fetching calendar events with rooms:', roomIds);
  }

  const response = await api.get('/scheduling/bookings/calendar/', { params });
  return response.data;
};

export const dragUpdateBooking = async (id, data) => {
  const response = await api.patch(`/scheduling/bookings/${id}/drag_update/`, data);
  return response.data;
};

// ============== WAITLIST ==============

export const getWaitlist = async (params = {}) => {
  const response = await api.get('/scheduling/waitlist/', { params });
  return response.data;
};

export const getWaitlistEntry = async (id) => {
  const response = await api.get(`/scheduling/waitlist/${id}/`);
  return response.data;
};

export const createWaitlistEntry = async (data) => {
  const response = await api.post('/scheduling/waitlist/', data);
  return response.data;
};

export const updateWaitlistEntry = async (id, data) => {
  const response = await api.put(`/scheduling/waitlist/${id}/`, data);
  return response.data;
};

export const deleteWaitlistEntry = async (id) => {
  const response = await api.delete(`/scheduling/waitlist/${id}/`);
  return response.data;
};

export const prioritizeWaitlist = async (id, priority) => {
  const response = await api.post(`/scheduling/waitlist/${id}/prioritize/`, {
    priority
  });
  return response.data;
};

export const fulfillWaitlist = async (id) => {
  const response = await api.post(`/scheduling/waitlist/${id}/fulfill/`);
  return response.data;
};

// Default export with all functions
export default {
  // Rooms
  getRooms,
  getRoom,
  createRoom,
  updateRoom,
  partialUpdateRoom,
  deleteRoom,
  getRoomAvailability,
  addEquipmentToRoom,
  removeEquipmentFromRoom,
  
  // Equipment
  getEquipment,
  getEquipmentItem,
  createEquipment,
  updateEquipment,
  deleteEquipment,
  
  // Time Slots
  getTimeSlots,
  getTimeSlot,
  createTimeSlot,
  updateTimeSlot,
  deleteTimeSlot,
  
  // Bookings
  getBookings,
  getBooking,
  createBooking,
  updateBooking,
  partialUpdateBooking,
  deleteBooking,
  approveBooking,
  rejectBooking,
  cancelBooking,
  modifyBooking,
  getBookingHistory,
  overrideConflict,
  bulkCancelBookings,
  bulkDeleteBookings,
  getCalendarEvents,
  dragUpdateBooking,
  
  // Waitlist
  getWaitlist,
  getWaitlistEntry,
  createWaitlistEntry,
  updateWaitlistEntry,
  deleteWaitlistEntry,
  prioritizeWaitlist,
  fulfillWaitlist
};
