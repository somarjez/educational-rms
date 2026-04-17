import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { useNavigate } from 'react-router-dom';
import './FeatureLanding.css';

const RoomsLanding = () => {
  const [rooms, setRooms] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    availability: '',
    date: '',
    equipment_category: ''
  });
  const [formData, setFormData] = useState({ 
    name: '', 
    building: '', 
    floor: '',
    room_type: 'CLASSROOM',
    capacity: '', 
    description: '' 
  });
  const navigate = useNavigate();

  useEffect(() => {
    console.log('RoomsLanding component mounted');
    fetchEquipment();
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [filters]);

  const fetchRooms = async () => {
    console.log('Fetching rooms...');
    try {
      const params = {};
      if (filters.search) params.search = filters.search;
      if (filters.equipment_category) params.equipment_category = filters.equipment_category;
      if (filters.date) {
        params.date = filters.date;
        params.availability = filters.availability || 'available';
      } else if (filters.availability) {
        params.availability = filters.availability;
      }

      const response = await api.get('/scheduling/rooms/', { params });
      console.log('Rooms API response:', response.data);
      // Handle both paginated (object with results) and non-paginated (array) responses
      const roomsData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      console.log('Rooms extracted:', roomsData);
      setRooms(roomsData);
      setError(null);
    } catch (err) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to fetch rooms';
      setError(errorMessage);
      console.error('Error fetching rooms:', err);
      console.error('Error response:', err.response);
    } finally {
      setLoading(false);
      console.log('Loading complete');
    }
  };

  const fetchEquipment = async () => {
    try {
      const response = await api.get('/scheduling/equipment/', { params: { is_active: true } });
      const equipmentData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setEquipment(equipmentData);
    } catch (err) {
      console.error('Error fetching equipment:', err);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const handleCreateRoom = async (e) => {
    e.preventDefault();
    console.log('Creating room with data:', formData);
    
    // Client-side validation
    if (formData.floor && formData.floor.length > 10) {
      setError('Floor must be 10 characters or less. Use short format like "1F", "2F", "GF"');
      return;
    }
    
    try {
      const response = await api.post('/scheduling/rooms/', formData);
      console.log('Room created successfully:', response.data);
      setFormData({ name: '', building: '', floor: '', room_type: 'CLASSROOM', capacity: '', description: '' });
      setShowForm(false);
      setError(null);
      console.log('Fetching updated room list...');
      await fetchRooms();
      console.log('Room list refreshed, should see new room now');
    } catch (err) {
      let errorMessage = 'Failed to create room';
      
      // Parse backend validation errors
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'object') {
          errorMessage = Object.entries(errors)
            .map(([field, messages]) => {
              const msgs = Array.isArray(messages) ? messages : [messages];
              return `${field}: ${msgs.join(', ')}`;
            })
            .join(' | ');
        } else if (errors.detail) {
          errorMessage = errors.detail;
        }
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      console.error('Error creating room:', err);
      console.error('Error response:', err.response);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Are you sure you want to delete this room?')) {
      try {
        await api.delete(`/scheduling/rooms/${roomId}/`);
        console.log('Room deleted successfully');
        await fetchRooms();
      } catch (err) {
        const errorMessage = err.response?.data?.detail || err.message || 'Failed to delete room';
        setError(errorMessage);
        console.error('Error deleting room:', err);
      }
    }
  };

  console.log('Rendering RoomsLanding - Loading:', loading, 'Error:', error, 'Rooms count:', rooms.length);

  if (loading) {
    return (
      <div className="feature-landing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', color: '#2c3e50' }}>
          <div style={{ fontSize: '2rem', marginBottom: '1rem' }}>⏳</div>
          <div>Loading rooms...</div>
        </div>
      </div>
    );
  }

  if (error && !rooms.length) {
    return (
      <div className="feature-landing">
        <div className="feature-header">
          <div className="feature-title-section">
            <h1>🏢 Room Management</h1>
            <p className="feature-subtitle">Create, edit, and delete room/lab resources</p>
          </div>
        </div>
        <div className="error-banner" style={{ marginTop: '2rem' }}>
          <strong>Error:</strong> {error}
          <br />
          <button className="btn btn-primary" style={{ marginTop: '1rem' }} onClick={() => { setError(null); fetchRooms(); }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="feature-landing">
      <div className="feature-header">
        <div className="feature-title-section">
          <h1>🏢 Room Management</h1>
          <p className="feature-subtitle">Create, edit, and delete room/lab resources</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Room'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="form-container">
          <form onSubmit={handleCreateRoom} className="feature-form">
            <div className="form-group">
              <label>Room Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Lab A, Classroom 101"
              />
            </div>
            <div className="form-group">
              <label>Building</label>
              <input
                type="text"
                value={formData.building}
                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                placeholder="e.g., Building A, Main Campus"
                maxLength="100"
              />
            </div>
            <div className="form-group">
              <label>Floor (max 10 chars)</label>
              <input
                type="text"
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                placeholder="e.g., 1st, G, 2nd"
                maxLength="10"
              />
              <small style={{ color: '#666', fontSize: '0.85rem' }}>
                Keep it short: "1st", "G", "2nd" etc.
              </small>
            </div>
            <div className="form-group">
              <label>Room Type *</label>
              <select
                required
                value={formData.room_type}
                onChange={(e) => setFormData({ ...formData, room_type: e.target.value })}
              >
                <option value="CLASSROOM">Classroom</option>
                <option value="LAB">Computer Lab</option>
                <option value="CONFERENCE">Conference Room</option>
                <option value="AUDITORIUM">Auditorium</option>
                <option value="STUDY_ROOM">Study Room</option>
              </select>
            </div>
            <div className="form-group">
              <label>Capacity *</label>
              <input
                type="number"
                required
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                placeholder="Number of people"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <button type="submit" className="btn btn-success">Create Room</button>
          </form>
        </div>
      )}

      <div className="feature-stats">
        <div className="stat-card">
          <div className="stat-number">{rooms.length}</div>
          <div className="stat-label">Total Rooms</div>
        </div>
      </div>

      <div className="filters-section">
        <input
          type="text"
          name="search"
          placeholder="Search rooms..."
          value={filters.search}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <input
          type="date"
          name="date"
          value={filters.date}
          onChange={handleFilterChange}
          className="filter-input"
        />
        <select
          name="availability"
          value={filters.availability}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Availability</option>
          <option value="available">Available</option>
          <option value="unavailable">Unavailable</option>
        </select>
        <select
          name="equipment_category"
          value={filters.equipment_category}
          onChange={handleFilterChange}
          className="filter-select"
        >
          <option value="">All Equipment Types</option>
          {[...new Set(equipment.map(item => item.category).filter(Boolean))].map(category => (
            <option key={category} value={category}>{category}</option>
          ))}
        </select>
      </div>

      <div className="rooms-grid">
        {rooms.length === 0 ? (
          <div className="empty-state">
            <p>No rooms found. Create your first room to get started!</p>
          </div>
        ) : (
          rooms.map((room) => (
            <div key={room.id} className="room-card">
              <div className="room-header">
                <h3>{room.name}</h3>
                <span className="room-badge">{room.room_type}</span>
              </div>
              <div className="room-details">
                <p><strong>Building:</strong> {room.building || 'N/A'}</p>
                <p><strong>Floor:</strong> {room.floor || 'N/A'}</p>
                <p><strong>Capacity:</strong> {room.capacity} people</p>
                {room.description && <p><strong>Description:</strong> {room.description}</p>}
              </div>
              <div className="room-actions">
                <button className="btn btn-secondary" onClick={() => navigate(`/admin-scheduling`, { state: { tab: 'rooms', editingRoom: room } })}>
                  Edit
                </button>
                <button className="btn btn-danger" onClick={() => handleDeleteRoom(room.id)}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RoomsLanding;
