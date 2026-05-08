import React, { useState, useEffect } from 'react';
import {
  getRooms, createRoom, updateRoom, deleteRoom,
  getEquipment
} from '../../../services/schedulingApi';
import {
  FaHome,
  FaBox,
  FaUsers,
  FaStream,
  FaBuilding,
  FaFileAlt
} from 'react-icons/fa';
import {
  FiCalendar,
  FiChevronDown,
  FiPlus,
  FiSearch
} from 'react-icons/fi';
import api from '../../../services/api';
import ConfirmModal from '../../../components/Common/Modal/ConfirmModal';
import AlertModal from '../../../components/Common/Modal/AlertModal';
import arrowsOutIcon from './assets/ArrowsOut.svg';
import buildingsIcon from './assets/Buildings.svg';
import shapesIcon from './assets/Shapes.svg';
import stackIcon from './assets/Stack.svg';
import toolboxIcon from './assets/Toolbox.svg';
import './styles/RoomManagement.css';

const RoomManagement = () => {
  const [rooms, setRooms] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showEquipmentModal, setShowEquipmentModal] = useState(false);
  const [currentRoom, setCurrentRoom] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    room_type: '',
    is_active: 'true',
    availability: '',
    date: '',
    equipment_category: ''
  });

  // Modal states
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDangerous: false });
  const [alertModal, setAlertModal] = useState({ isOpen: false, title: '', message: '', type: 'info' });

  const [formData, setFormData] = useState({
    name: '',
    room_type: 'LAB',
    capacity: '',
    floor: '',
    building: '',
    description: '',
    features: [],
    is_active: true
  });

  const [selectedEquipment, setSelectedEquipment] = useState([]);
  const [equipmentQuantities, setEquipmentQuantities] = useState({}); // { equipmentId: quantity }
  const [roomEquipment, setRoomEquipment] = useState([]); // Equipment already assigned to room

  const roomTypes = [
    { value: 'LAB', label: 'Computer Lab' },
    { value: 'CLASSROOM', label: 'Classroom' },
    { value: 'CONFERENCE', label: 'Conference Room' },
    { value: 'AUDITORIUM', label: 'Auditorium' },
    { value: 'STUDY_ROOM', label: 'Study Room' }
  ];

  const roomDetailRows = (room) => [
    {
      icon: shapesIcon,
      label: 'Type',
      value: roomTypes.find(t => t.value === room.room_type)?.label || room.room_type || 'Room'
    },
    {
      icon: arrowsOutIcon,
      label: 'Capacity',
      value: `${room.capacity || 0} people`
    },
    {
      icon: stackIcon,
      label: 'Floor',
      value: room.floor || '-'
    },
    {
      icon: buildingsIcon,
      label: 'Building',
      value: room.building || '-'
    },
    {
      icon: toolboxIcon,
      label: 'Equipment Items',
      value: `${room.equipment_count || 0} types`
    }
  ];

  useEffect(() => {
    fetchRooms();
    fetchEquipment();
  }, [filters]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.room_type) params.room_type = filters.room_type;
      if (filters.is_active) params.is_active = filters.is_active;
      if (filters.equipment_category) params.equipment_category = filters.equipment_category;
      if (filters.date) {
        params.date = filters.date;
        params.availability = filters.availability || 'available';
      } else if (filters.availability) {
        params.availability = filters.availability;
      }

      const data = await getRooms(params);
      setRooms(Array.isArray(data) ? data : data.results || []);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to fetch rooms');
      console.error('Error fetching rooms:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchEquipment = async () => {
    try {
      const data = await getEquipment({ is_active: true });
      setEquipment(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Error fetching equipment:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleFeatureAdd = (feature) => {
    if (feature && !formData.features.includes(feature)) {
      setFormData(prev => ({
        ...prev,
        features: [...prev.features, feature]
      }));
    }
  };

  const handleFeatureRemove = (feature) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features.filter(f => f !== feature)
    }));
  };

  const openCreateModal = () => {
    setCurrentRoom(null);
    setFormData({
      name: '',
      room_type: 'LAB',
      capacity: '',
      floor: '',
      building: '',
      description: '',
      features: [],
      is_active: true
    });
    setShowModal(true);
  };

  const openEditModal = (room) => {
    setCurrentRoom(room);
    setFormData({
      name: room.name,
      room_type: room.room_type,
      capacity: room.capacity,
      floor: room.floor || '',
      building: room.building || '',
      description: room.description || '',
      features: room.features || [],
      is_active: room.is_active
    });
    setShowModal(true);
  };

  const openEquipmentModal = async (room) => {
    setCurrentRoom(room);
    setShowEquipmentModal(true);
    
    // Fetch current room equipment distribution
    try {
      const response = await api.get('/equipment-config/equipment_distribution/');
      
      // Build current assignments map
      const roomAssignments = {};
      const enrichedEquipment = response.data.map(equip => {
        const roomAssignment = equip.rooms.find(r => r.id === room.id);
        const currentQty = roomAssignment ? roomAssignment.quantity_in_room : 0;
        
        if (currentQty > 0) {
          roomAssignments[equip.equipment_id] = currentQty;
        }
        
        return {
          equipment_id: equip.equipment_id,
          name: equip.name,
          description: equip.description,
          category: equip.category || 'General',
          total_quantity: equip.total_quantity,
          available_quantity: equip.available_quantity,
          currently_assigned: currentQty
        };
      });
      
      setEquipmentQuantities(roomAssignments);
      setRoomEquipment(enrichedEquipment);
    } catch (error) {
      console.error('Failed to load equipment distribution:', error);
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: 'Failed to load equipment data',
        type: 'error'
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      
      const submitData = {
        ...formData,
        capacity: parseInt(formData.capacity)
      };

      if (currentRoom) {
        await updateRoom(currentRoom.id, submitData);
      } else {
        await createRoom(submitData);
      }

      setShowModal(false);
      fetchRooms();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save room');
      console.error('Error saving room:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleEquipmentSave = async () => {
    try {
      setLoading(true);

      const operations = [];
      for (const item of roomEquipment) {
        const equipmentId = item.equipment_id;
        const currentQty = item.currently_assigned || 0;
        const desiredQtyRaw = equipmentQuantities[equipmentId] !== undefined
          ? equipmentQuantities[equipmentId]
          : currentQty;
        const desiredQty = Number(desiredQtyRaw || 0);

        if (desiredQty === currentQty) {
          continue;
        }

        if (desiredQty <= 0 && currentQty > 0) {
          operations.push({
            name: item.name,
            promise: api.post('/equipment-config/remove-equipment-from-room/', {
              room_id: currentRoom.id,
              equipment_id: equipmentId,
            }),
          });
          continue;
        }

        if (desiredQty > 0) {
          operations.push({
            name: item.name,
            promise: api.post('/equipment-config/distribute-equipment/', {
              room_id: currentRoom.id,
              equipment_id: equipmentId,
              quantity: desiredQty,
            }),
          });
        }
      }

      if (!operations.length) {
        setAlertModal({
          isOpen: true,
          title: 'No Changes',
          message: 'No equipment quantity changes to save.',
          type: 'info'
        });
        setLoading(false);
        return;
      }

      const results = await Promise.allSettled(operations.map((op) => op.promise));
      const failed = [];
      results.forEach((result, idx) => {
        if (result.status === 'rejected') {
          const errorMsg = result.reason?.response?.data?.error || result.reason?.message || 'Unknown error';
          failed.push(`${operations[idx].name}: ${errorMsg}`);
        }
      });

      if (failed.length > 0) {
        setAlertModal({
          isOpen: true,
          title: 'Partial Save',
          message: `Some assignments failed:\n${failed.slice(0, 4).join('\n')}`,
          type: 'warning'
        });
      } else {
        setAlertModal({
          isOpen: true,
          title: 'Success',
          message: 'Equipment distribution updated successfully',
          type: 'success'
        });
      }

      setShowEquipmentModal(false);
      fetchRooms();
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err.response?.data?.error || 'Failed to update equipment',
        type: 'error'
      });
      console.error('Error updating equipment:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveEquipment = async (equipmentId) => {
    try {
      await api.post(
        '/equipment-config/remove-equipment-from-room/',
        {
          room_id: currentRoom.id,
          equipment_id: equipmentId
        }
      );
      
      // Update local state
      const newQuantities = { ...equipmentQuantities };
      delete newQuantities[equipmentId];
      setEquipmentQuantities(newQuantities);
      
      setAlertModal({
        isOpen: true,
        title: 'Success',
        message: 'Equipment removed successfully',
        type: 'success'
      });
    } catch (err) {
      setAlertModal({
        isOpen: true,
        title: 'Error',
        message: err.response?.data?.error || 'Failed to remove equipment',
        type: 'error'
      });
    }
  };

  const handleDelete = async (id) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete Room',
      message: 'Are you sure you want to delete this room? This cannot be undone.',
      isDangerous: true,
      onConfirm: async () => {
        try {
          setLoading(true);
          await deleteRoom(id);
          setConfirmModal(prev => ({ ...prev, isOpen: false }));
          fetchRooms();
        } catch (err) {
          setError('Failed to delete room');
          console.error('Error deleting room:', err);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const toggleEquipment = (equipmentId) => {
    setSelectedEquipment(prev => {
      if (prev.includes(equipmentId)) {
        return prev.filter(id => id !== equipmentId);
      } else {
        return [...prev, equipmentId];
      }
    });
  };

  return (
    <div className="room-management">
      <div className="room-management-header">
        <h2>Room & Lab Management</h2>
        <button className="btn btn-primary" onClick={openCreateModal}>
          <FiPlus aria-hidden="true" />
          Add Room
        </button>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
          <button onClick={() => setError(null)} className="alert-close">×</button>
        </div>
      )}

      {/* Filters */}
      <div className="filters" aria-label="Room filters">
        <label className="room-search">
          <FiSearch className="room-search-icon" aria-hidden="true" />
          <input
            type="text"
            name="search"
            aria-label="Search rooms"
            value={filters.search}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </label>

        <div className="filter-row">
          <label className="select-wrap">
            <select
              name="room_type"
              value={filters.room_type}
              onChange={handleFilterChange}
              className="filter-select filter-select-outline"
              aria-label="Filter by room type"
            >
              <option value="">All Types</option>
              {roomTypes.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <FiChevronDown aria-hidden="true" />
          </label>

          <label className="select-wrap">
            <select
              name="availability"
              value={filters.availability}
              onChange={handleFilterChange}
              className="filter-select filter-select-filled"
              aria-label="Filter by availability"
            >
              <option value="">All Availability</option>
              <option value="available">Available</option>
              <option value="unavailable">Unavailable</option>
            </select>
            <FiChevronDown aria-hidden="true" />
          </label>

          <label className="select-wrap">
            <select
              name="is_active"
              value={filters.is_active}
              onChange={handleFilterChange}
              className="filter-select filter-select-filled"
              aria-label="Filter by active status"
            >
              <option value="true">Active Only</option>
              <option value="false">Inactive Only</option>
              <option value="">All Status</option>
            </select>
            <FiChevronDown aria-hidden="true" />
          </label>

          <label className="select-wrap select-wrap-wide">
            <select
              name="equipment_category"
              value={filters.equipment_category}
              onChange={handleFilterChange}
              className="filter-select filter-select-filled"
              aria-label="Filter by equipment type"
            >
              <option value="">All Equipment Types</option>
              {[...new Set(equipment.map(item => item.category).filter(Boolean))].map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <FiChevronDown aria-hidden="true" />
          </label>

          <label className="room-date">
            <input
              type="date"
              name="date"
              value={filters.date}
              onChange={handleFilterChange}
              className="filter-input"
              aria-label="Filter by date"
            />
            <FiCalendar aria-hidden="true" />
          </label>
        </div>
      </div>

      {/* Room List */}
      {loading && rooms.length === 0 ? (
        <div className="loading">Loading rooms...</div>
      ) : (
        <div className="room-grid">
          {rooms.map(room => (
            <div key={room.id} className="room-card">
              <div className="room-card-header">
                <h3>{room.name}</h3>
                <span className={`badge badge-${room.is_active ? 'success' : 'secondary'}`}>
                  {room.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              
              <div className="room-card-body">
                {roomDetailRows(room).map((row) => (
                  <div className="room-detail-row" key={row.label}>
                    <span className="room-detail-label">
                      <img src={row.icon} alt="" aria-hidden="true" />
                      <strong>{row.label}</strong>
                    </span>
                    <span className="room-detail-value">{row.value}</span>
                  </div>
                ))}
                <button
                  className="btn-link"
                  onClick={() => openEquipmentModal(room)}
                >
                  View Equipment Details
                </button>
              </div>

              <div className="room-card-actions">
                <button
                  className="btn btn-sm btn-secondary"
                  onClick={() => openEquipmentModal(room)}
                >
                  Manage Equipment
                </button>
                <button
                  className="btn btn-sm btn-primary"
                  onClick={() => openEditModal(room)}
                >
                  Edit
                </button>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDelete(room.id)}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{currentRoom ? 'EDIT ROOM' : 'CREATE A NEW ROOM'}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label htmlFor="room-name">
                    <FaHome size={12} color="#5AA8E6" />
                    Room Name
                  </label>
                  <input
                    id="room-name"
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="room-type">
                    <FaBox size={12} color="#5AA8E6" />
                    Room Type
                  </label>
                  <select
                    id="room-type"
                    name="room_type"
                    value={formData.room_type}
                    onChange={handleInputChange}
                    required
                    className="form-input"
                  >
                    {roomTypes.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="capacity">
                    <FaUsers size={12} color="#5AA8E6" />
                    Capacity
                  </label>
                  <input
                    id="capacity"
                    type="number"
                    name="capacity"
                    value={formData.capacity}
                    onChange={handleInputChange}
                    required
                    min="1"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="floor">
                    <FaStream size={12} color="#5AA8E6" />
                    Floor
                  </label>
                  <input
                    id="floor"
                    type="text"
                    name="floor"
                    value={formData.floor}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="building">
                    <FaBuilding size={12} color="#5AA8E6" />
                    Building
                  </label>
                  <input
                    id="building"
                    type="text"
                    name="building"
                    value={formData.building}
                    onChange={handleInputChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="description">
                    <FaFileAlt size={12} color="#5AA8E6" />
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="form-input"
                  />
                </div>

                <div className="form-group full-width">
                  <label htmlFor="is-active">
                    <input
                      id="is-active"
                      type="checkbox"
                      name="is_active"
                      checked={formData.is_active}
                      onChange={handleInputChange}
                    />
                    {' '}Active
                  </label>
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Equipment Modal */}
      {showEquipmentModal && (
        <div className="modal-overlay" onClick={() => setShowEquipmentModal(false)}>
          <div className="modal-content large-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Equipment - {currentRoom?.name}</h3>
              <button className="modal-close" onClick={() => setShowEquipmentModal(false)}>×</button>
            </div>

            <div className="equipment-distribution">
              <h4>Assign Equipment Quantities</h4>
              <p className="help-text">Enter the quantity of each equipment item to assign to this room.</p>
              
              {roomEquipment.length > 0 ? (
                <div className="equipment-table">
                  <table>
                    <thead>
                      <tr>
                        <th>Equipment</th>
                        <th>Category</th>
                        <th>Total Available</th>
                        <th>Can Assign</th>
                        <th>Currently Here</th>
                        <th>Assign Quantity</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {roomEquipment.map(item => {
                        const currentlyAssigned = item.currently_assigned || 0;
                        const maxAvailable = item.available_quantity + currentlyAssigned;
                        const newQuantity = equipmentQuantities[item.equipment_id] !== undefined 
                          ? equipmentQuantities[item.equipment_id] 
                          : currentlyAssigned;
                        
                        return (
                          <tr key={item.equipment_id}>
                            <td>
                              <strong>{item.name}</strong>
                              {item.description && (
                                <small style={{ display: 'block', color: '#666' }}>
                                  {item.description}
                                </small>
                              )}
                            </td>
                            <td>{item.category}</td>
                            <td>{item.total_quantity}</td>
                            <td style={{ color: maxAvailable > 0 ? '#28a745' : '#dc3545', fontWeight: 'bold' }}>
                              {maxAvailable}
                            </td>
                            <td>
                              {currentlyAssigned > 0 ? (
                                <span style={{ color: '#0066cc', fontWeight: 'bold' }}>{currentlyAssigned}</span>
                              ) : (
                                <span style={{ color: '#999' }}>-</span>
                              )}
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                max={maxAvailable}
                                value={newQuantity}
                                onChange={(e) => {
                                  const value = parseInt(e.target.value) || 0;
                                  if (value <= maxAvailable) {
                                    setEquipmentQuantities(prev => ({
                                      ...prev,
                                      [item.equipment_id]: value
                                    }));
                                  }
                                }}
                                className="quantity-input"
                                style={{ width: '80px' }}
                                placeholder="0"
                              />
                              <small style={{ display: 'block', color: '#666', marginTop: '4px' }}>
                                Max: {maxAvailable}
                              </small>
                            </td>
                            <td>
                              {currentlyAssigned > 0 && (
                                <button
                                  className="btn btn-sm btn-danger"
                                  onClick={() => handleRemoveEquipment(item.equipment_id)}
                                  title="Remove all from this room"
                                >
                                  Clear
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p>Loading equipment...</p>
              )}
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowEquipmentModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleEquipmentSave}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
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
      />    </div>
  );
};

export default RoomManagement;
