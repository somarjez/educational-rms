import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getBookings, getEquipment, getRooms, getTimeSlots, createBooking } from '../../services/schedulingApi';
import {
  buildEquipmentRequestPayload,
  extractEquipmentRequestDetails,
  isEquipmentRequestBooking,
} from '../../features/equipmentRequest/equipmentRequestUtils';
import BaseModal from '../../components/Common/Modal/BaseModal';
import DashboardHeader from '../../features/dashboard/core/DashboardHeader';
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
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
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
  const [selectedCategory, setSelectedCategory] = useState('All');

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
  const userRoleLabel = user?.role
    ? String(user.role).charAt(0).toUpperCase() + String(user.role).slice(1).toLowerCase()
    : 'User';

  const availableTimeSlots = useMemo(() => {
    if (!form.date) return timeSlots;
    const day = new Date(form.date).getDay();
    const weekday = day === 0 ? 6 : day - 1;

    return timeSlots.filter((slot) => {
      if (!slot.days_of_week || slot.days_of_week.length === 0) return true;
      return slot.days_of_week.includes(weekday);
    });
  }, [timeSlots, form.date]);

  const equipmentCategories = useMemo(() => {
    const categories = new Set(['All']);
    equipment.forEach((item) => {
      const category = item.category?.trim() || 'Uncategorized';
      categories.add(category);
    });
    return Array.from(categories).sort((a, b) => {
      if (a === 'All') return -1;
      if (b === 'All') return 1;
      return a.localeCompare(b);
    });
  }, [equipment]);

  const availableEquipment = useMemo(
    () => equipment.filter((item) => {
      const isActive = item.is_active && Number(item.available_quantity || 0) > 0;
      if (!isActive) return false;
      if (selectedCategory === 'All') return true;
      const itemCategory = item.category?.trim() || 'Uncategorized';
      return itemCategory === selectedCategory;
    }),
    [equipment, selectedCategory]
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

  const handleLogout = () => {
    logout();
    navigate('/login');
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
    <div className="landing-page equipment-request-page">
      <DashboardHeader
        user={user || { role: 'User' }}
        onLogout={handleLogout}
        onProfileClick={() => navigate('/profile')}
      />

      <div className="equipment-request-content">
      <div className="equipment-request-topbar">
        <div className="equipment-request-topbar-spacer" />
        <div className="equipment-request-topbar-actions">
          <span className="equipment-request-bell" aria-label="Notifications">●</span>
          <button type="button" className="equipment-request-logout" onClick={logout}>
            Log Out
          </button>
          <span className="equipment-request-role-pill">{userRoleLabel}</span>
          <span className="equipment-request-status-dot" aria-hidden="true" />
          <div className="equipment-request-brand">
            <strong>Educational Resource Management</strong>
            <span>Your comprehensive resource management platform.</span>
          </div>
        </div>
      </div>

      <div className="landing-header">
        <div>
          <h1 className="landing-title">REQUEST EQUIPMENT</h1>
          <p className="landing-subtitle">Resource inventory currently available.</p>
        </div>
        <button type="button" className="btn btn-primary equipment-request-trigger" onClick={openRequestModal}>
          + NEW EQUIPMENT REQUEST
        </button>
      </div>

      {loading ? (
        <div className="empty-state">Loading equipment requests...</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : (
        <>
          <div className="equipment-category-filters">
            {equipmentCategories.map((category) => (
              <button
                key={category}
                className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </button>
            ))}
          </div>

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
            title="SUBMIT EQUIPMENT REQUEST"
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
                <label className="equipment-request-field equipment-request-field--full">
                  <span className="equipment-request-field-label">Equipment <span className="equipment-request-required">*</span></span>
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

                <label className="equipment-request-field">
                  <span className="equipment-request-field-label">Quantity <span className="equipment-request-required">*</span></span>
                  <input
                    className="equipment-request-quantity-input"
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) => handleChange('quantity', e.target.value)}
                    required
                  />
                </label>

                <label className="equipment-request-field">
                  <span className="equipment-request-field-label">Date Needed <span className="equipment-request-required">*</span></span>
                  <input
                    type="date"
                    min={new Date().toISOString().split('T')[0]}
                    value={form.date}
                    onChange={(e) => handleChange('date', e.target.value)}
                    required
                  />
                </label>

                <label className="equipment-request-field">
                  <span className="equipment-request-field-label">Time Needed <span className="equipment-request-required">*</span></span>
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

                <label className="equipment-request-field">
                  <span className="equipment-request-field-label">Room / Lab <span className="equipment-request-required">*</span></span>
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

              <label className="equipment-request-field equipment-request-field--full">
                <span className="equipment-request-field-label">Purpose / Reason <span className="equipment-request-required">*</span></span>
                <textarea
                  rows="3"
                  value={form.purpose}
                  onChange={(e) => handleChange('purpose', e.target.value)}
                  required
                />
              </label>

              <label className="equipment-request-field equipment-request-field--full">
                <span className="equipment-request-field-label">Remarks</span>
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
    </div>
  );
};

export default EquipmentRequestPage;
