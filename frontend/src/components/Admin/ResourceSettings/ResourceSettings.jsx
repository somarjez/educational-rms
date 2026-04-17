import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { getEquipment, createEquipment, updateEquipment, deleteEquipment } from '../../../services/schedulingApi';
import { getTimeSlots, createTimeSlot, updateTimeSlot, deleteTimeSlot } from '../../../services/schedulingApi';
import ConfirmModal from '../../../components/Common/Modal/ConfirmModal';
import AlertModal from '../../../components/Common/Modal/AlertModal';
import './styles/ResourceSettings.css';

const API_BASE = 'http://localhost:8000/api/v1';

const extractApiErrorMessage = (err, fallbackMessage) => {
  const data = err?.response?.data;

  if (!data) return fallbackMessage;
  if (typeof data === 'string') return data;
  if (data.error && typeof data.error === 'string') return data.error;
  if (data.detail && typeof data.detail === 'string') return data.detail;

  if (typeof data === 'object') {
    const messages = Object.entries(data)
      .flatMap(([field, value]) => {
        if (Array.isArray(value)) {
          return value.map((msg) => `${field}: ${msg}`);
        }
        if (typeof value === 'string') {
          return [`${field}: ${value}`];
        }
        return [];
      })
      .filter(Boolean);

    if (messages.length) {
      return messages.join(' | ');
    }
  }

  return fallbackMessage;
};

const ResourceSettings = () => {
  const [equipment, setEquipment] = useState([]);
  const [equipmentDistribution, setEquipmentDistribution] = useState({}); // Map of equipment_id -> room assignments
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeSection, setActiveSection] = useState('equipment');
  const [showModal, setShowModal] = useState(false);
  const [currentItem, setCurrentItem] = useState(null);
  const [modalType, setModalType] = useState('equipment');
  const [equipmentFilters, setEquipmentFilters] = useState({
    search: '',
    availability: '',
    date: '',
    category: ''
  });
  const [timeSlotFilters, setTimeSlotFilters] = useState({
    search: '',
    availability: '',
    date: '',
    slot_type: ''
  });

  // Modal states
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDangerous: false });
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    category: '',
    description: '',
    quantity: '1',
    is_active: true
  });

  const [timeSlotForm, setTimeSlotForm] = useState({
    name: '',
    slot_type: 'HOURLY',
    start_time: '',
    end_time: '',
    is_active: true,
    days_of_week: []
  });

  const slotTypes = [
    { value: 'HOURLY', label: 'Hourly' },
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' }
  ];

  const equipmentCategoryOptions = [
    { value: '', label: 'Uncategorized' },
    { value: 'AV', label: 'AV' },
    { value: 'LAB', label: 'Lab' },
    { value: 'FURNITURE', label: 'Furniture' },
    { value: 'COMPUTING', label: 'Computing' },
    { value: 'SAFETY', label: 'Safety' },
    { value: 'OTHER', label: 'Other' }
  ];

  const daysOfWeek = [
    { value: 0, label: 'Monday' },
    { value: 1, label: 'Tuesday' },
    { value: 2, label: 'Wednesday' },
    { value: 3, label: 'Thursday' },
    { value: 4, label: 'Friday' },
    { value: 5, label: 'Saturday' },
    { value: 6, label: 'Sunday' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [equipData, slotsData] = await Promise.all([
        getEquipment(),
        getTimeSlots()
      ]);
      setEquipment(Array.isArray(equipData) ? equipData : equipData.results || []);
      setTimeSlots(Array.isArray(slotsData) ? slotsData : slotsData.results || []);
      
      // Fetch equipment distribution
      await fetchEquipmentDistribution();
      
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipmentDistribution = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await axios.get(
        `${API_BASE}/equipment-config/equipment_distribution/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Build a map of equipment_id -> room assignments
      const distributionMap = {};
      response.data.forEach(equip => {
        distributionMap[equip.equipment_id] = equip.rooms.map(room => ({
          id: room.id,
          name: room.name,
          quantity: room.quantity_in_room,
          assigned_date: room.assigned_date
        }));
      });
      
      setEquipmentDistribution(distributionMap);
    } catch (err) {
      console.error('Error fetching equipment distribution:', err);
    }
  };

  // Equipment handlers
  const openEquipmentModal = (item = null) => {
    setModalType('equipment');
    setCurrentItem(item);
    if (item) {
      setEquipmentForm({
        name: item.name,
        category: item.category || '',
        description: item.description || '',
        quantity: String(item.quantity ?? 1),
        is_active: item.is_active
      });
    } else {
      setEquipmentForm({
        name: '',
        category: '',
        description: '',
        quantity: '1',
        is_active: true
      });
    }
    setShowModal(true);
  };

  const handleEquipmentSubmit = async (e) => {
    e.preventDefault();

    const quantity = Number(equipmentForm.quantity);
    if (!Number.isFinite(quantity) || quantity < 1) {
      setError('Quantity must be a valid number greater than 0');
      return;
    }

    const payload = {
      name: equipmentForm.name.trim(),
      category: equipmentForm.category,
      description: equipmentForm.description.trim(),
      quantity,
      is_active: Boolean(equipmentForm.is_active)
    };

    try {
      setLoading(true);
      if (currentItem) {
        await updateEquipment(currentItem.id, payload);
        setSuccess('Equipment updated successfully');
      } else {
        await createEquipment(payload);
        setSuccess('Equipment created successfully');
      }
      setShowModal(false);
      setCurrentItem(null);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(extractApiErrorMessage(err, 'Failed to save equipment'));
      console.error('Error saving equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentDelete = async (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Equipment',
      message: 'Are you sure you want to delete this equipment? This cannot be undone.',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await deleteEquipment(id);
          setSuccess('Equipment deleted');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          fetchData();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
          setError('Failed to delete equipment');
          console.error('Error deleting equipment:', err);
        }
      }
    });
  };

  // Time Slot handlers
  const openTimeSlotModal = (item = null) => {
    setModalType('timeslot');
    setCurrentItem(item);
    if (item) {
      setTimeSlotForm({
        name: item.name,
        slot_type: item.slot_type,
        start_time: item.start_time,
        end_time: item.end_time,
        is_active: item.is_active,
        days_of_week: item.days_of_week || []
      });
    } else {
      setTimeSlotForm({
        name: '',
        slot_type: 'HOURLY',
        start_time: '',
        end_time: '',
        is_active: true,
        days_of_week: []
      });
    }
    setShowModal(true);
  };

  const handleTimeSlotSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (currentItem) {
        await updateTimeSlot(currentItem.id, timeSlotForm);
        setSuccess('Time slot updated successfully');
      } else {
        await createTimeSlot(timeSlotForm);
        setSuccess('Time slot created successfully');
      }
      setShowModal(false);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError('Failed to save time slot');
      console.error('Error saving time slot:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeSlotDelete = async (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Time Slot',
      message: 'Are you sure you want to delete this time slot? This cannot be undone.',
      isDangerous: true,
      onConfirm: async () => {
        try {
          await deleteTimeSlot(id);
          setSuccess('Time slot deleted');
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          fetchData();
          setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
          setError('Failed to delete time slot');
          console.error('Error deleting time slot:', err);
        }
      }
    });
  };

  const toggleDay = (day) => {
    setTimeSlotForm(prev => ({
      ...prev,
      days_of_week: prev.days_of_week.includes(day)
        ? prev.days_of_week.filter(d => d !== day)
        : [...prev.days_of_week, day]
    }));
  };

  const filteredEquipment = useMemo(() => {
    const searchTerm = equipmentFilters.search.trim().toLowerCase();
    const dateFilter = equipmentFilters.date ? new Date(equipmentFilters.date) : null;

    return equipment.filter(item => {
      const matchesSearch = !searchTerm ||
        item.name?.toLowerCase().includes(searchTerm) ||
        item.description?.toLowerCase().includes(searchTerm) ||
        item.category?.toLowerCase().includes(searchTerm);

      const matchesCategory = !equipmentFilters.category || item.category === equipmentFilters.category;

      let matchesAvailability = true;
      if (equipmentFilters.availability) {
        const availableQty = Number.isFinite(item.available_quantity)
          ? item.available_quantity
          : Math.max((item.quantity || 0) - (item.assigned_quantity || 0), 0);
        matchesAvailability = equipmentFilters.availability === 'available'
          ? availableQty > 0
          : availableQty <= 0;
      }

      let matchesDate = true;
      if (dateFilter) {
        const assignments = equipmentDistribution[item.id] || [];
        matchesDate = assignments.some(assignment => {
          if (!assignment.assigned_date) return false;
          const assignedDate = new Date(assignment.assigned_date);
          return assignedDate.toDateString() === dateFilter.toDateString();
        });
      }

      return matchesSearch && matchesCategory && matchesAvailability && matchesDate;
    });
  }, [equipment, equipmentDistribution, equipmentFilters]);

  const filteredTimeSlots = useMemo(() => {
    const searchTerm = timeSlotFilters.search.trim().toLowerCase();
    const dateFilter = timeSlotFilters.date ? new Date(timeSlotFilters.date) : null;
    const weekday = dateFilter ? dateFilter.getDay() : null;

    return timeSlots.filter(slot => {
      const matchesSearch = !searchTerm || slot.name?.toLowerCase().includes(searchTerm);
      const matchesType = !timeSlotFilters.slot_type || slot.slot_type === timeSlotFilters.slot_type;

      let matchesAvailability = true;
      if (timeSlotFilters.availability) {
        matchesAvailability = timeSlotFilters.availability === 'available'
          ? slot.is_active
          : !slot.is_active;
      }

      let matchesDate = true;
      if (weekday !== null) {
        const slotDays = Array.isArray(slot.days_of_week) ? slot.days_of_week : [];
        matchesDate = slotDays.length === 0 || slotDays.includes(weekday);
      }

      return matchesSearch && matchesType && matchesAvailability && matchesDate;
    });
  }, [timeSlots, timeSlotFilters]);

  return (
    <div className="resource-settings">
      <div className="section-tabs">
        <button
          className={`section-tab ${activeSection === 'equipment' ? 'active' : ''}`}
          onClick={() => setActiveSection('equipment')}
        >
          Equipment
        </button>
        <button
          className={`section-tab ${activeSection === 'timeslots' ? 'active' : ''}`}
          onClick={() => setActiveSection('timeslots')}
        >
          Time Slots
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          {success}
          <button onClick={() => setSuccess(null)} className="alert-close">×</button>
        </div>
      )}

      {/* Equipment Section */}
      {activeSection === 'equipment' && (
        <div className="section-content">
          <div className="section-header">
            <h3>Equipment Management</h3>
            <button className="btn btn-primary" onClick={() => openEquipmentModal()}>
              + Add Equipment
            </button>
          </div>

          <div className="filters-row">
            <input
              type="text"
              placeholder="Search equipment..."
              value={equipmentFilters.search}
              onChange={(e) => setEquipmentFilters(prev => ({ ...prev, search: e.target.value }))}
              className="filter-input"
            />
            <input
              type="date"
              value={equipmentFilters.date}
              onChange={(e) => setEquipmentFilters(prev => ({ ...prev, date: e.target.value }))}
              className="filter-input"
            />
            <select
              value={equipmentFilters.availability}
              onChange={(e) => setEquipmentFilters(prev => ({ ...prev, availability: e.target.value }))}
              className="filter-select"
            >
              <option value="">All Availability</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <select
              value={equipmentFilters.category}
              onChange={(e) => setEquipmentFilters(prev => ({ ...prev, category: e.target.value }))}
              className="filter-select"
            >
              <option value="">All Equipment Types</option>
              {[...new Set(equipment.map(item => item.category).filter(Boolean))].map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="items-grid">
              {filteredEquipment.map(item => {
                const roomAssignments = equipmentDistribution[item.id] || [];
                const hasAssignments = roomAssignments.length > 0;
                
                return (
                  <div key={item.id} className="item-card">
                    <div className="item-header">
                      <h4>{item.name}</h4>
                      <span className={`badge ${item.is_active ? 'badge-success' : 'badge-secondary'}`}>
                        {item.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <p className="item-description" style={{ marginBottom: '6px', fontWeight: 600 }}>
                      Category: {item.category || 'Uncategorized'}
                    </p>
                    <p className="item-description">{item.description || 'No description'}</p>
                    <div style={{ marginTop: '10px' }}>
                      <p><strong>Total Quantity:</strong> {item.quantity}</p>
                      {item.assigned_quantity !== undefined && (
                        <>
                          <p><strong>Assigned:</strong> {item.assigned_quantity}</p>
                          <p><strong>Available:</strong> <span style={{ 
                            color: item.available_quantity > 0 ? '#28a745' : '#dc3545',
                            fontWeight: 'bold' 
                          }}>{item.available_quantity}</span></p>
                        </>
                      )}
                      
                      {hasAssignments && (
                        <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid #e0e0e0' }}>
                          <p style={{ marginBottom: '6px', fontSize: '0.875rem', fontWeight: '600' }}>
                            📋 Assigned to Rooms:
                          </p>
                          <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.875rem' }}>
                            {roomAssignments.map(room => (
                              <li key={room.id} style={{ marginBottom: '4px' }}>
                                <strong>{room.name}</strong>: {room.quantity} units
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    <div className="item-actions">
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => openEquipmentModal(item)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-danger"
                        onClick={() => handleEquipmentDelete(item.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Time Slots Section */}
      {activeSection === 'timeslots' && (
        <div className="section-content">
          <div className="section-header">
            <h3>Time Slot Management</h3>
            <button className="btn btn-primary" onClick={() => openTimeSlotModal()}>
              + Add Time Slot
            </button>
          </div>

          <div className="filters-row">
            <input
              type="text"
              placeholder="Search time slots..."
              value={timeSlotFilters.search}
              onChange={(e) => setTimeSlotFilters(prev => ({ ...prev, search: e.target.value }))}
              className="filter-input"
            />
            <input
              type="date"
              value={timeSlotFilters.date}
              onChange={(e) => setTimeSlotFilters(prev => ({ ...prev, date: e.target.value }))}
              className="filter-input"
            />
            <select
              value={timeSlotFilters.availability}
              onChange={(e) => setTimeSlotFilters(prev => ({ ...prev, availability: e.target.value }))}
              className="filter-select"
            >
              <option value="">All Availability</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <select
              value={timeSlotFilters.slot_type}
              onChange={(e) => setTimeSlotFilters(prev => ({ ...prev, slot_type: e.target.value }))}
              className="filter-select"
            >
              <option value="">All Types</option>
              {slotTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>

          {loading ? (
            <div className="loading">Loading...</div>
          ) : (
            <div className="items-grid">
              {filteredTimeSlots.map(slot => (
                <div key={slot.id} className="item-card">
                  <div className="item-header">
                    <h4>{slot.name}</h4>
                    <span className={`badge ${slot.is_active ? 'badge-success' : 'badge-secondary'}`}>
                      {slot.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p><strong>Type:</strong> {slot.slot_type}</p>
                  <p><strong>Time:</strong> {slot.start_time} - {slot.end_time}</p>
                  <div className="item-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => openTimeSlotModal(slot)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleTimeSlotDelete(slot.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalType === 'equipment'
                  ? currentItem ? 'Edit Equipment' : 'Add Equipment'
                  : currentItem ? 'Edit Time Slot' : 'Add Time Slot'
                }
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            {modalType === 'equipment' ? (
              <form onSubmit={handleEquipmentSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={equipmentForm.name}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={equipmentForm.category}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, category: e.target.value })}
                      className="form-input"
                    >
                      {equipmentCategoryOptions.map(option => (
                        <option key={option.value || 'uncategorized'} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={equipmentForm.description}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, description: e.target.value })}
                      rows="3"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Quantity *</label>
                    <input
                      type="number"
                      value={equipmentForm.quantity}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, quantity: e.target.value })}
                      min="1"
                      required
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={equipmentForm.is_active}
                        onChange={(e) => setEquipmentForm({ ...equipmentForm, is_active: e.target.checked })}
                      />
                      {' '}Active
                    </label>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleTimeSlotSubmit}>
                <div className="modal-body">
                  <div className="form-group">
                    <label>Name *</label>
                    <input
                      type="text"
                      value={timeSlotForm.name}
                      onChange={(e) => setTimeSlotForm({ ...timeSlotForm, name: e.target.value })}
                      required
                      className="form-input"
                      placeholder="e.g., Morning Slot, Period 1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Type *</label>
                    <select
                      value={timeSlotForm.slot_type}
                      onChange={(e) => setTimeSlotForm({ ...timeSlotForm, slot_type: e.target.value })}
                      required
                      className="form-input"
                    >
                      {slotTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Start Time *</label>
                      <input
                        type="time"
                        value={timeSlotForm.start_time}
                        onChange={(e) => setTimeSlotForm({ ...timeSlotForm, start_time: e.target.value })}
                        required
                        className="form-input"
                      />
                    </div>

                    <div className="form-group">
                      <label>End Time *</label>
                      <input
                        type="time"
                        value={timeSlotForm.end_time}
                        onChange={(e) => setTimeSlotForm({ ...timeSlotForm, end_time: e.target.value })}
                        required
                        className="form-input"
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Available Days</label>
                    <div className="days-selector">
                      {daysOfWeek.map(day => (
                        <label key={day.value} className="day-checkbox">
                          <input
                            type="checkbox"
                            checked={timeSlotForm.days_of_week.includes(day.value)}
                            onChange={() => toggleDay(day.value)}
                          />
                          {day.label}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={timeSlotForm.is_active}
                        onChange={(e) => setTimeSlotForm({ ...timeSlotForm, is_active: e.target.checked })}
                      />
                      {' '}Active
                    </label>
                  </div>
                </div>

                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Save
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        isDangerous={confirmModal.isDangerous}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />

      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onClose={() => setAlertModal(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default ResourceSettings;
