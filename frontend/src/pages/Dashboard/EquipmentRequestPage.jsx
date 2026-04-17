import React, { useEffect, useMemo, useState } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { getBookings, getEquipment, getRooms, getTimeSlots, createBooking } from '../../services/schedulingApi';
import {
  buildEquipmentRequestPayload,
  extractEquipmentRequestDetails,
  isEquipmentRequestBooking,
} from '../../features/equipmentRequest/equipmentRequestUtils';
import BaseModal from '../../components/Common/Modal/BaseModal';
import './LandingPages.css';
import './EquipmentRequestPages.css';

const toList = (data) => (Array.isArray(data) ? data : data?.results || []);
const UNCATEGORIZED_VALUES = new Set(['', 'UNCATEGORIZED', 'UNASSIGNED', 'N/A', 'NONE', 'NULL']);

const formatRoomOptionLabel = (room) => {
  const type = room?.room_type || 'ROOM';
  const capacity = room?.capacity ?? 'N/A';
  return `${room.name} (${type}) - Capacity: ${capacity}`;
};

const isUncategorizedEquipment = (item) => {
  const rawCategory = item?.category;
  if (rawCategory == null) return true;

  const normalizedCategory = String(rawCategory).trim().toUpperCase();
  return UNCATEGORIZED_VALUES.has(normalizedCategory);
};

const EquipmentRequestPage = () => {
  const { user } = useAuthStore();
  const [equipment, setEquipment] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState('');
  const [timeSlots, setTimeSlots] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [submitMessage, setSubmitMessage] = useState('');
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);

  const [form, setForm] = useState({
    equipmentId: '',
    quantity: 1,
    date: '',
    timeSlotId: '',
    roomId: '',
    purpose: '',
    remarks: '',
  });

  const selectedEquipment = equipment.find((item) => Number(item.id) === Number(form.equipmentId));

  const availableTimeSlots = useMemo(() => {
    if (!form.date) return timeSlots;
    const day = new Date(form.date).getDay();
    const weekday = day === 0 ? 6 : day - 1;

    return timeSlots.filter((slot) => {
      if (!slot.days_of_week || slot.days_of_week.length === 0) return true;
      return slot.days_of_week.includes(weekday);
    });
  }, [timeSlots, form.date]);

  const availableEquipment = useMemo(
    () => equipment.filter((item) => item.is_active && Number(item.available_quantity || 0) > 0),
    [equipment]
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const [equipmentRes, roomRes, timeSlotRes, bookingRes] = await Promise.all([
        getEquipment({ is_active: true }),
        getRooms({ is_active: true }),
        getTimeSlots({ is_active: true }),
        getBookings({ page_size: 200 }),
      ]);

      const equipmentList = toList(equipmentRes);
      const roomList = toList(roomRes);
      const bookings = toList(bookingRes).filter(isEquipmentRequestBooking);

      setEquipment(equipmentList);
      setAllRooms(roomList);
      setRooms([]);
      setTimeSlots(toList(timeSlotRes));
      setMyRequests(bookings);
      setError('');
    } catch (err) {
      setError('Failed to load equipment request data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const loadRooms = async () => {
      if (!form.equipmentId) {
        setRooms([]);
        setRoomsError('');
        return;
      }

      setRoomsLoading(true);
      setRoomsError('');
      
      try {
        const shouldBypassCompatibility = isUncategorizedEquipment(selectedEquipment);
        let roomList = [];
        let usedCompatibilityFilter = false;

        if (shouldBypassCompatibility) {
          roomList = allRooms;
        } else {
          const filteredRoomRes = await getRooms({
            is_active: true,
            equipment_id: form.equipmentId,
          });
          const compatibleRooms = toList(filteredRoomRes);

          if (compatibleRooms.length > 0) {
            roomList = compatibleRooms;
            usedCompatibilityFilter = true;
          } else {
            roomList = allRooms;
          }
        }
        
        if (roomList.length === 0) {
          setRooms([]);
          setRoomsError(
            shouldBypassCompatibility || !usedCompatibilityFilter
              ? 'No active rooms are available right now.'
              : 'No simulation-compatible rooms are available for the selected equipment.'
          );
        } else {
          setRoomsError('');
        }

        setRooms(roomList);
      } catch (err) {
        console.error('Error loading rooms:', err);
        setRoomsError('Failed to load available rooms.');
        setRooms([]);
      } finally {
        setRoomsLoading(false);
      }
    };

    loadRooms();
  }, [allRooms, form.equipmentId, selectedEquipment]);

  const handleChange = (key, value) => {
    setForm((prev) => ({
      ...prev,
      [key]: value,
      ...(key === 'equipmentId' ? { roomId: '', timeSlotId: '' } : {}),
      ...(key === 'date' ? { timeSlotId: '' } : {}),
    }));
    // Clear error messages when user makes changes
    if (key === 'equipmentId') {
      setRoomsError('');
    }
  };

  useEffect(() => {
    if (!form.timeSlotId) return;
    const exists = availableTimeSlots.some((slot) => Number(slot.id) === Number(form.timeSlotId));
    if (!exists) {
      setForm((prev) => ({ ...prev, timeSlotId: '' }));
    }
  }, [availableTimeSlots, form.timeSlotId]);

  const openRequestModal = () => {
    setSubmitMessage('');
    setIsRequestModalOpen(true);
  };

  const closeRequestModal = () => {
    if (submitting) return;
    setIsRequestModalOpen(false);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitMessage('');

    if (!selectedEquipment) {
      setSubmitMessage('Please select an available equipment item.');
      return;
    }

    const requestedQuantity = Number(form.quantity || 0);
    const availableQuantity = Number(selectedEquipment.available_quantity || 0);

    if (requestedQuantity <= 0) {
      setSubmitMessage('Requested quantity must be at least 1.');
      return;
    }

    if (requestedQuantity > availableQuantity) {
      setSubmitMessage(`Requested quantity exceeds available stock (${availableQuantity}).`);
      return;
    }

    if (!form.roomId || !form.timeSlotId || !form.date || !form.purpose.trim()) {
      setSubmitMessage('Please complete all required fields.');
      return;
    }

    const payload = buildEquipmentRequestPayload({
      roomId: form.roomId,
      timeSlotId: form.timeSlotId,
      date: form.date,
      purpose: form.purpose,
      equipment: selectedEquipment,
      quantity: requestedQuantity,
      remarks: form.remarks,
      userId: user?.id,
    });

    try {
      setSubmitting(true);
      await createBooking(payload);
      setSubmitMessage('Equipment request submitted successfully.');
      setForm({
        equipmentId: '',
        quantity: 1,
        date: '',
        timeSlotId: '',
        roomId: '',
        purpose: '',
        remarks: '',
      });
      await loadData();
      setIsRequestModalOpen(false);
    } catch (err) {
      const detail = err?.response?.data?.detail;
      setSubmitMessage(detail || 'Failed to submit equipment request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="landing-page">
      <div className="landing-header">
        <div>
          <h1 className="landing-title">Request Equipment</h1>
          <p className="landing-subtitle">Submit a request for available equipment</p>
        </div>
        <button type="button" className="btn btn-primary equipment-request-trigger" onClick={openRequestModal}>
          New Equipment Request
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading equipment requests...</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : (
        <>
          <div className="landing-list equipment-available-list">
            <div className="landing-list-header">
              <span>Equipment</span>
              <span>Category</span>
              <span>Available</span>
              <span>Total</span>
            </div>
            {availableEquipment.length === 0 ? (
              <div className="landing-list-item">
                <span>No available equipment.</span>
                <span>-</span>
                <span>-</span>
                <span>-</span>
              </div>
            ) : (
              availableEquipment.map((item) => (
                <div key={item.id} className="landing-list-item">
                  <span>{item.name}</span>
                  <span>{item.category || 'N/A'}</span>
                  <span>{item.available_quantity}</span>
                  <span>{item.quantity}</span>
                </div>
              ))
            )}
          </div>

          {!isRequestModalOpen && submitMessage ? <p className="equipment-request-message equipment-request-page-message">{submitMessage}</p> : null}

          <div className="landing-list equipment-request-history">
            <div className="landing-list-header">
              <span>Equipment</span>
              <span>Quantity</span>
              <span>Date Needed</span>
              <span>Status</span>
            </div>
            {myRequests.length === 0 ? (
              <div className="landing-list-item">
                <span>No equipment requests submitted yet.</span>
                <span>-</span>
                <span>-</span>
                <span>-</span>
              </div>
            ) : (
              myRequests.map((request) => {
                const details = extractEquipmentRequestDetails(request);
                return (
                  <div key={request.id} className="landing-list-item">
                    <span>{details.equipmentName}</span>
                    <span>{details.quantity}</span>
                    <span>{request.date}</span>
                    <span>
                      <span className={`status-pill status-${String(request.status || '').toLowerCase() || 'default'}`}>
                        {request.status}
                      </span>
                    </span>
                  </div>
                );
              })
            )}
          </div>

          <BaseModal
            isOpen={isRequestModalOpen}
            typeClass="modal-info equipment-request-modal-shell"
            icon="🛠️"
            title="Submit Equipment Request"
            onClose={closeRequestModal}
            actions={(
              <>
                <button type="button" className="modal-btn-secondary" onClick={closeRequestModal} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" form="equipment-request-form" className="modal-btn-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit Equipment Request'}
                </button>
              </>
            )}
          >
            <form id="equipment-request-form" className="equipment-request-form equipment-request-form--modal" onSubmit={handleSubmit}>
              <div className="equipment-request-grid">
                <label>
                  Equipment *
                  <select
                    value={form.equipmentId}
                    onChange={(e) => handleChange('equipmentId', e.target.value)}
                    required
                  >
                    <option value="">Select equipment</option>
                    {availableEquipment.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </select>
                </label>

                <label>
                  Quantity *
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    required
                  />
                </label>

                <label>
                  Date Needed *
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={form.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    required
                  />
                </label>

                <label>
                  Time Needed *
                  <select
                    value={form.timeSlotId}
                    onChange={(e) => handleChange('timeSlotId', e.target.value)}
                    required
                  >
                    <option value="">Select time slot</option>
                    {availableTimeSlots.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.name} ({slot.start_time} - {slot.end_time})
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Room *
                  <select
                    value={form.roomId}
                    onChange={(e) => handleChange('roomId', e.target.value)}
                    required
                    disabled={roomsLoading || !form.equipmentId}
                  >
                    <option value="">
                      {!form.equipmentId
                        ? 'Select equipment first'
                        : roomsLoading
                          ? 'Loading rooms...'
                          : rooms.length
                            ? 'Select room with equipment'
                            : 'No compatible rooms available'}
                    </option>
                    {rooms.map((room) => (
                      <option key={room.id} value={room.id}>{formatRoomOptionLabel(room)}</option>
                    ))}
                  </select>
                </label>
                {roomsError && (
                  <div className="form-error-message equipment-request-modal-error">
                    {roomsError}
                  </div>
                )}
              </div>

              <label>
                Purpose / Reason *
                <textarea
                  rows="3"
                  value={form.purpose}
                  onChange={(e) => handleChange('purpose', e.target.value)}
                  required
                />
              </label>

              <label>
                Remarks
                <textarea
                  rows="2"
                  value={form.remarks}
                  onChange={(e) => handleChange('remarks', e.target.value)}
                />
              </label>

              {submitMessage ? <p className="equipment-request-message">{submitMessage}</p> : null}
            </form>
          </BaseModal>
        </>
      )}
    </div>
  );
};

export default EquipmentRequestPage;
