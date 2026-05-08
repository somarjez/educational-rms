import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import api from '../../services/api';
import './FeatureLanding.css';

const API_BASE = 'http://localhost:8000/api/v1';

const EquipmentLanding = () => {
  const [equipment, setEquipment] = useState([]);
  const [timeSlots, setTimeSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('equipment');
  const [equipmentDistribution, setEquipmentDistribution] = useState({});
  
  // Equipment filters
  const [equipmentFilters, setEquipmentFilters] = useState({
    search: '',
    category: '',
    availability: '',
    date: ''
  });

  // Time slot filters
  const [timeSlotFilters, setTimeSlotFilters] = useState({
    search: '',
    type: '',
    availability: '',
    date: ''
  });

  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('equipment');
  const [currentItem, setCurrentItem] = useState(null);

  const equipmentCategoryOptions = [
    { value: '', label: 'Uncategorized' },
    { value: 'AV', label: 'AV' },
    { value: 'LAB', label: 'Lab' },
    { value: 'FURNITURE', label: 'Furniture' },
    { value: 'COMPUTING', label: 'Computing' },
    { value: 'SAFETY', label: 'Safety' },
    { value: 'OTHER', label: 'Other' }
  ];

  const slotTypes = [
    { value: 'HOURLY', label: 'Hourly' },
    { value: 'DAILY', label: 'Daily' },
    { value: 'WEEKLY', label: 'Weekly' }
  ];

  const [equipmentForm, setEquipmentForm] = useState({
    name: '',
    category: '',
    description: '',
    quantity: '1',
    is_active: true,
  });

  const [timeSlotForm, setTimeSlotForm] = useState({
    name: '',
    slot_type: 'HOURLY',
    start_time: '',
    end_time: '',
    is_active: true,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [equipmentRes, slotsRes] = await Promise.all([
        api.get('/scheduling/equipment/'),
        api.get('/scheduling/time-slots/'),
      ]);

      const equipmentData = Array.isArray(equipmentRes.data) ? equipmentRes.data : (equipmentRes.data.results || []);
      const slotsData = Array.isArray(slotsRes.data) ? slotsRes.data : (slotsRes.data.results || []);
      
      setEquipment(equipmentData);
      setTimeSlots(slotsData);
      
      await fetchEquipmentDistribution();
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
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

  const handleCreateEquipment = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: equipmentForm.name.trim(),
        category: equipmentForm.category,
        description: equipmentForm.description.trim(),
        quantity: Number(equipmentForm.quantity) || 1,
        is_active: Boolean(equipmentForm.is_active)
      };

      if (currentItem) {
        await api.put(`/scheduling/equipment/${currentItem.id}/`, payload);
        setSuccess('Equipment updated successfully');
      } else {
        await api.post('/scheduling/equipment/', payload);
        setSuccess('Equipment created successfully');
      }

      setEquipmentForm({ name: '', category: '', description: '', quantity: '1', is_active: true });
      setShowModal(false);
      setCurrentItem(null);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save equipment');
    }
  };

  const handleDeleteEquipment = async (equipmentId) => {
    if (window.confirm('Are you sure you want to delete this equipment?')) {
      try {
        await api.delete(`/scheduling/equipment/${equipmentId}/`);
        setSuccess('Equipment deleted successfully');
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Failed to delete equipment');
      }
    }
  };

  const handleCreateTimeSlot = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: timeSlotForm.name.trim(),
        slot_type: timeSlotForm.slot_type,
        start_time: timeSlotForm.start_time,
        end_time: timeSlotForm.end_time,
        is_active: Boolean(timeSlotForm.is_active),
      };

      if (currentItem) {
        await api.put(`/scheduling/time-slots/${currentItem.id}/`, payload);
        setSuccess('Time slot updated successfully');
      } else {
        await api.post('/scheduling/time-slots/', payload);
        setSuccess('Time slot created successfully');
      }

      setTimeSlotForm({ name: '', slot_type: 'HOURLY', start_time: '', end_time: '', is_active: true });
      setShowModal(false);
      setCurrentItem(null);
      fetchData();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to save time slot');
    }
  };

  const handleDeleteTimeSlot = async (slotId) => {
    if (window.confirm('Are you sure you want to delete this time slot?')) {
      try {
        await api.delete(`/scheduling/time-slots/${slotId}/`);
        setSuccess('Time slot deleted successfully');
        fetchData();
        setTimeout(() => setSuccess(null), 3000);
      } catch (err) {
        setError('Failed to delete time slot');
      }
    }
  };

  const filteredEquipment = useMemo(() => {
    return equipment.filter(item => {
      const searchMatch = !equipmentFilters.search || 
        item.name?.toLowerCase().includes(equipmentFilters.search.toLowerCase()) ||
        item.description?.toLowerCase().includes(equipmentFilters.search.toLowerCase());
      
      const categoryMatch = !equipmentFilters.category || item.category === equipmentFilters.category;
      
      const availabilityMatch = !equipmentFilters.availability || 
        (equipmentFilters.availability === 'available' ? item.is_active : !item.is_active);
      
      return searchMatch && categoryMatch && availabilityMatch;
    });
  }, [equipment, equipmentFilters]);

  const filteredTimeSlots = useMemo(() => {
    return timeSlots.filter(slot => {
      const searchMatch = !timeSlotFilters.search || 
        slot.name?.toLowerCase().includes(timeSlotFilters.search.toLowerCase());
      
      const typeMatch = !timeSlotFilters.type || slot.slot_type === timeSlotFilters.type;
      
      const availabilityMatch = !timeSlotFilters.availability || 
        (timeSlotFilters.availability === 'available' ? slot.is_active : !slot.is_active);
      
      return searchMatch && typeMatch && availabilityMatch;
    });
  }, [timeSlots, timeSlotFilters]);

  const categories = [...new Set(equipment.map(item => item.category).filter(Boolean))];

  const openEquipmentModal = (item = null) => {
    setModalType('equipment');
    setCurrentItem(item);
    if (item) {
      setEquipmentForm({
        name: item.name,
        category: item.category || '',
        description: item.description || '',
        quantity: String(item.quantity || 1),
        is_active: item.is_active
      });
    } else {
      setEquipmentForm({ name: '', category: '', description: '', quantity: '1', is_active: true });
    }
    setShowModal(true);
  };

  const openTimeSlotModal = (slot = null) => {
    setModalType('timeslot');
    setCurrentItem(slot);
    if (slot) {
      setTimeSlotForm({
        name: slot.name,
        slot_type: slot.slot_type,
        start_time: slot.start_time || '',
        end_time: slot.end_time || '',
        is_active: slot.is_active
      });
    } else {
      setTimeSlotForm({ name: '', slot_type: 'HOURLY', start_time: '', end_time: '', is_active: true });
    }
    setShowModal(true);
  };

  if (loading) return <div className="equipment-landing loading">Loading...</div>;

  return (
    <div className="equipment-landing">
      <div className="landing-header">
        <div className="header-content">
          <div className="header-copy">
            <h1>Equipment & Time Slots Management</h1>
            <p className="subtitle">Configure equipment linked to rooms and manage time slot definitions</p>
          </div>
        </div>
      </div>

      <div className="tab-navigation">
        <button 
          className={`tab-btn ${activeTab === 'equipment' ? 'active' : ''}`}
          onClick={() => setActiveTab('equipment')}
        >
          <span className="tab-label">EQUIPMENT</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'timeslots' ? 'active' : ''}`}
          onClick={() => setActiveTab('timeslots')}
        >
          <span className="tab-label">TIME SLOTS</span>
        </button>
      </div>

      <div className="tab-content">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        {/* Equipment Tab */}
        {activeTab === 'equipment' && (
          <div className="section-wrapper">
            <div className="section-header">
              <h2>Equipment Management</h2>
              <button className="add-btn" onClick={() => openEquipmentModal()}>
                <span>+ Add Equipment</span>
              </button>
            </div>

            <div className="filter-bar">
              <div className="search-input-wrap">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search equipment..."
                  value={equipmentFilters.search}
                  onChange={(e) => setEquipmentFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              
              <div className="filter-chips">
                <select 
                  className="filter-chip filled"
                  value={equipmentFilters.category}
                  onChange={(e) => setEquipmentFilters(prev => ({ ...prev, category: e.target.value }))}
                >
                  <option value="">All Equipment Types</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>

                <select 
                  className="filter-chip filled"
                  value={equipmentFilters.availability}
                  onChange={(e) => setEquipmentFilters(prev => ({ ...prev, availability: e.target.value }))}
                >
                  <option value="">All Availability</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>

                <input
                  type="date"
                  className="filter-chip-date"
                  value={equipmentFilters.date}
                  onChange={(e) => setEquipmentFilters(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="equipment-grid">
              {filteredEquipment.length === 0 ? (
                <div className="empty-state">
                  <p>No equipment found. Add your first equipment!</p>
                </div>
              ) : (
                filteredEquipment.map((item) => {
                  const roomAssignments = equipmentDistribution[item.id] || [];
                  return (
                    <div key={item.id} className="equipment-card">
                      <div className="card-header">
                        <h3 className="card-title">{item.name}</h3>
                        <span className={`badge-active`}>
                          {item.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      
                      <div className="card-body">
                        <div className="card-row">
                          <span className="card-row-label">Category</span>
                          <span className="card-row-value">{item.category || 'Uncategorized'}</span>
                        </div>
                        <div className="card-row">
                          <span className="card-row-label">Description</span>
                          <span className="card-row-value">{item.description || 'N/A'}</span>
                        </div>
                        <div className="card-row">
                          <span className="card-row-label">Total Quantity</span>
                          <span className="card-row-value">{item.quantity}</span>
                        </div>
                        <div className="card-row">
                          <span className="card-row-label">Assigned</span>
                          <span className="card-row-value">{item.assigned_quantity || 0}</span>
                        </div>
                        <div className="card-row">
                          <span className="card-row-label">Available</span>
                          <span className="card-row-value" style={{ color: '#1a9e55' }}>
                            {(item.quantity || 0) - (item.assigned_quantity || 0)}
                          </span>
                        </div>
                      </div>

                      {roomAssignments.length > 0 && (
                        <div className="card-assignments">
                          <div className="assignment-label">ASSIGNED TO ROOMS</div>
                          <ul className="assignment-list">
                            {roomAssignments.map(room => (
                              <li key={room.id}>• {room.name}: {room.quantity} unit{room.quantity !== 1 ? 's' : ''}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="card-footer">
                        <button 
                          className="btn-edit"
                          onClick={() => openEquipmentModal(item)}
                        >
                          Edit
                        </button>
                        <button 
                          className="btn-delete"
                          onClick={() => handleDeleteEquipment(item.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Time Slots Tab */}
        {activeTab === 'timeslots' && (
          <div className="section-wrapper">
            <div className="section-header">
              <h2>Time Slot Management</h2>
              <button className="add-btn" onClick={() => openTimeSlotModal()}>
                <span>+ Add Time Slot</span>
              </button>
            </div>

            <div className="filter-bar">
              <div className="search-input-wrap">
                <span className="search-icon">🔍</span>
                <input
                  type="text"
                  placeholder="Search time slots..."
                  value={timeSlotFilters.search}
                  onChange={(e) => setTimeSlotFilters(prev => ({ ...prev, search: e.target.value }))}
                />
              </div>
              
              <div className="filter-chips">
                <select 
                  className="filter-chip filled"
                  value={timeSlotFilters.type}
                  onChange={(e) => setTimeSlotFilters(prev => ({ ...prev, type: e.target.value }))}
                >
                  <option value="">All Types</option>
                  {slotTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>

                <select 
                  className="filter-chip filled"
                  value={timeSlotFilters.availability}
                  onChange={(e) => setTimeSlotFilters(prev => ({ ...prev, availability: e.target.value }))}
                >
                  <option value="">All Availability</option>
                  <option value="available">Available</option>
                  <option value="unavailable">Unavailable</option>
                </select>

                <input
                  type="date"
                  className="filter-chip-date"
                  value={timeSlotFilters.date}
                  onChange={(e) => setTimeSlotFilters(prev => ({ ...prev, date: e.target.value }))}
                />
              </div>
            </div>

            <div className="equipment-grid">
              {filteredTimeSlots.length === 0 ? (
                <div className="empty-state">
                  <p>No time slots found. Add your first time slot!</p>
                </div>
              ) : (
                filteredTimeSlots.map((slot) => (
                  <div key={slot.id} className="equipment-card">
                    <div className="card-header">
                      <h3 className="card-title">{slot.name}</h3>
                      <span className={`badge-active`}>
                        {slot.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    
                    <div className="card-body">
                      <div className="card-row">
                        <span className="card-row-label">Type</span>
                        <span className="card-row-value">{slot.slot_type}</span>
                      </div>
                      <div className="card-row">
                        <span className="card-row-label">Start Time</span>
                        <span className="card-row-value">{slot.start_time || 'N/A'}</span>
                      </div>
                      <div className="card-row">
                        <span className="card-row-label">End Time</span>
                        <span className="card-row-value">{slot.end_time || 'N/A'}</span>
                      </div>
                    </div>

                    <div className="card-footer">
                      <button 
                        className="btn-edit"
                        onClick={() => openTimeSlotModal(slot)}
                      >
                        Edit
                      </button>
                      <button 
                        className="btn-delete"
                        onClick={() => handleDeleteTimeSlot(slot.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-window" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-header-left">
                <span className="modal-header-icon">⚙️</span>
                <h2>{currentItem ? 'Edit' : 'Add New'} {modalType === 'equipment' ? 'Equipment' : 'Time Slot'}</h2>
              </div>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>×</button>
            </div>

            <div className="modal-body">
              {modalType === 'equipment' ? (
                <form onSubmit={handleCreateEquipment}>
                  <div className="form-group">
                    <label className="form-label">Equipment Name <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={equipmentForm.name}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, name: e.target.value })}
                      placeholder="e.g., Projector"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <select
                      className="form-select"
                      value={equipmentForm.category}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, category: e.target.value })}
                    >
                      {equipmentCategoryOptions.map(opt => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Description</label>
                    <textarea
                      className="form-input"
                      value={equipmentForm.description}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, description: e.target.value })}
                      placeholder="Optional description"
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Quantity <span className="required">*</span></label>
                    <input
                      type="number"
                      className="form-input"
                      required
                      min="1"
                      value={equipmentForm.quantity}
                      onChange={(e) => setEquipmentForm({ ...equipmentForm, quantity: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <input
                        type="checkbox"
                        checked={equipmentForm.is_active}
                        onChange={(e) => setEquipmentForm({ ...equipmentForm, is_active: e.target.checked })}
                      />
                      {' '}Active
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                      {currentItem ? 'Update' : 'Create'}
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleCreateTimeSlot}>
                  <div className="form-group">
                    <label className="form-label">Time Slot Name <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      required
                      value={timeSlotForm.name}
                      onChange={(e) => setTimeSlotForm({ ...timeSlotForm, name: e.target.value })}
                      placeholder="e.g., Morning Slot"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select
                      className="form-select"
                      value={timeSlotForm.slot_type}
                      onChange={(e) => setTimeSlotForm({ ...timeSlotForm, slot_type: e.target.value })}
                    >
                      {slotTypes.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Start Time</label>
                      <input
                        type="time"
                        className="form-input"
                        value={timeSlotForm.start_time}
                        onChange={(e) => setTimeSlotForm({ ...timeSlotForm, start_time: e.target.value })}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">End Time</label>
                      <input
                        type="time"
                        className="form-input"
                        value={timeSlotForm.end_time}
                        onChange={(e) => setTimeSlotForm({ ...timeSlotForm, end_time: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">
                      <input
                        type="checkbox"
                        checked={timeSlotForm.is_active}
                        onChange={(e) => setTimeSlotForm({ ...timeSlotForm, is_active: e.target.checked })}
                      />
                      {' '}Active
                    </label>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                      {currentItem ? 'Update' : 'Create'}
                    </button>
                    <button type="button" className="btn btn-secondary" style={{ flex: 1 }} onClick={() => setShowModal(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentLanding;
