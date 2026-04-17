import React, { useState, useEffect, useMemo, useRef } from 'react';
import { getRooms, getTimeSlots, createBooking } from '../../../services/schedulingApi';
import { useAuthStore } from '../../../stores/authStore';
import AlertModal from '../../../components/Common/Modal/AlertModal';
import '../core/styles/Dashboard.css';

const QuickCreateBooking = ({ onCreated, onClose }) => {
  const { user } = useAuthStore();
  const submissionInProgress = useRef(false);
  const abortControllerRef = useRef(new AbortController());
  const [rooms, setRooms] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortControllerRef.current.abort();
    };
  }, []);

  const [formData, setFormData] = useState({
    room: '',
    time_slot: '',
    date: '',
    purpose: '',
    participants_count: 1,
    user: user?.id || '',
    is_recurring: false,
    recurrence_pattern: 'WEEKLY',
    recurrence_end_date: '',
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (user?.id) {
      setFormData((prev) => ({ ...prev, user: user.id }));
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [roomsRes, timeSlotsRes] = await Promise.all([
        getRooms(),
        getTimeSlots(),
      ]);
      const roomsData = Array.isArray(roomsRes) ? roomsRes : (roomsRes.results || []);
      const timeSlotsData = Array.isArray(timeSlotsRes) ? timeSlotsRes : (timeSlotsRes.results || []);
      setRooms(roomsData);
      setTimeSlots(timeSlotsData);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTimeSlotsByDate = (slots, dateStr) => {
    if (!dateStr) return slots;
    const day = new Date(dateStr).getDay();
    // Convert JS day (0=Sun) to backend day (0=Mon)
    const weekday = day === 0 ? 6 : day - 1;

    return slots.filter((slot) => {
      if (!slot.days_of_week || slot.days_of_week.length === 0) return true;
      return slot.days_of_week.includes(weekday);
    });
  };

  const availableTimeSlots = useMemo(
    () => filterTimeSlotsByDate(timeSlots, formData.date),
    [timeSlots, formData.date]
  );

  // Validate time slot when date changes
  useEffect(() => {
    if (!formData.date || !formData.time_slot) return;
    const stillValid = availableTimeSlots.some(
      (slot) => String(slot.id) === String(formData.time_slot)
    );
    if (!stillValid) {
      setFormData((prev) => ({ ...prev, time_slot: '' }));
    }
  }, [formData.date, availableTimeSlots]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Prevent duplicate submissions - triple check
    if (submissionInProgress.current || submitting) {
      console.warn('Submission already in progress, blocking duplicate attempt');
      return;
    }
    
    submissionInProgress.current = true;
    setSubmitting(true);

    try {
      const payload = {
        ...formData,
        user: formData.user || user?.id,
        room: formData.room ? Number(formData.room) : formData.room,
        time_slot: formData.time_slot ? Number(formData.time_slot) : formData.time_slot,
        participants_count: formData.participants_count ? Number(formData.participants_count) : formData.participants_count,
      };

      // Only include recurrence fields if is_recurring is true
      if (!payload.is_recurring) {
        delete payload.recurrence_pattern;
        delete payload.recurrence_end_date;
      }

      console.log('Submitting booking payload:', payload);
      await createBooking(payload);
      
      console.log('Booking created successfully');
      setAlertModal({ 
        isOpen: true, 
        title: 'Success', 
        message: 'Booking created successfully!', 
        type: 'success' 
      });
      
      // Wait for alert to be shown, then close
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Call onClose BEFORE onCreated to unmount this component
      onClose();
      
      // Then refresh the list
      onCreated();
      
    } catch (error) {
      const responseData = error.response?.data;
      let message = 'Failed to create booking';
      if (responseData) {
        if (typeof responseData === 'string') {
          message = responseData;
        } else if (responseData.detail) {
          message = responseData.detail;
        } else if (typeof responseData === 'object') {
          message = Object.entries(responseData)
            .map(([field, msgs]) => {
              const list = Array.isArray(msgs) ? msgs : [msgs];
              return `${field}: ${list.join(', ')}`;
            })
            .join(' | ');
        }
      }
      console.error('Failed to create booking:', responseData || error);
      setAlertModal({ 
        isOpen: true, 
        title: 'Error', 
        message: message, 
        type: 'error' 
      });
      
      // Reset submission flag on error
      submissionInProgress.current = false;
      setSubmitting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const nextValue = type === 'checkbox' ? checked : value;

    setFormData((prev) => {
      const next = { ...prev, [name]: nextValue };
      if (name === 'is_recurring' && !nextValue) {
        next.recurrence_pattern = 'WEEKLY';
        next.recurrence_end_date = '';
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="modal-overlay" onClick={onClose}>
        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Create New Booking</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <form onSubmit={handleSubmit} className="quick-booking-form">
          <div className="form-group">
            <label>Room/Lab *</label>
            <select
              name="room"
              value={formData.room}
              onChange={handleChange}
              required
            >
              <option value="">Select a room</option>
              {rooms.map((room) => (
                <option key={room.id} value={room.id}>
                  {room.name} ({room.room_type}) - Capacity: {room.capacity}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Date *</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="form-group">
            <label>Time Slot *</label>
            <select
              name="time_slot"
              value={formData.time_slot}
              onChange={handleChange}
              required
            >
              <option value="">Select a time slot</option>
              {availableTimeSlots.map((slot) => (
                <option key={slot.id} value={slot.id}>
                  {slot.name} ({slot.start_time} - {slot.end_time})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Purpose *</label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              placeholder="Enter booking purpose..."
              rows="3"
              required
            />
          </div>

          <div className="form-group">
            <label>Number of Participants *</label>
            <input
              type="number"
              name="participants_count"
              value={formData.participants_count}
              onChange={handleChange}
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="is_recurring"
                checked={formData.is_recurring}
                onChange={handleChange}
              />
              Repeat this booking
            </label>
            {formData.is_recurring && (
              <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '5px', marginBottom: '0' }}>
                ℹ️ A recurring booking will be created as one request. Once approved, all instances will be automatically approved.
              </p>
            )}
          </div>

          {formData.is_recurring && (
            <>
              <div className="form-group">
                <label>Repeat Pattern *</label>
                <select
                  name="recurrence_pattern"
                  value={formData.recurrence_pattern}
                  onChange={handleChange}
                  required
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="BIWEEKLY">Bi-weekly (Every 2 weeks)</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>

              <div className="form-group">
                <label>Repeat Until *</label>
                <input
                  type="date"
                  name="recurrence_end_date"
                  value={formData.recurrence_end_date}
                  onChange={handleChange}
                  min={formData.date || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
            </>
          )}

          <div className="modal-actions">
            <button
              type="button"
              className="modal-btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="modal-btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Creating...' : 'Create Booking'}
            </button>
          </div>
        </form>
      </div>

      <AlertModal
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        isOpen={alertModal.isOpen}
        onClose={() => setAlertModal({ ...alertModal, isOpen: false })}
      />
    </div>
  );
};

export default QuickCreateBooking;

