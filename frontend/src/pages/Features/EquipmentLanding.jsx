import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import './FeatureLanding.css';

const EquipmentLanding = () => {
  const [equipment, setEquipment] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    description: '',
    quantity: '',
    is_active: true,
  });

  const equipmentCategoryOptions = [
    { value: '', label: 'Uncategorized' },
    { value: 'AV', label: 'AV' },
    { value: 'LAB', label: 'Lab' },
    { value: 'FURNITURE', label: 'Furniture' },
    { value: 'COMPUTING', label: 'Computing' },
    { value: 'SAFETY', label: 'Safety' },
    { value: 'OTHER', label: 'Other' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [equipmentRes, roomsRes] = await Promise.all([
        api.get('/scheduling/equipment/'),
        api.get('/scheduling/rooms/'),
      ]);
      // Handle paginated responses
      const equipmentData = Array.isArray(equipmentRes.data) ? equipmentRes.data : (equipmentRes.data.results || []);
      const roomsData = Array.isArray(roomsRes.data) ? roomsRes.data : (roomsRes.data.results || []);
      setEquipment(equipmentData);
      setRooms(roomsData);
      setError(null);
    } catch (err) {
      setError('Failed to fetch data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEquipment = async (e) => {
    e.preventDefault();
    console.log('Creating equipment with data:', formData);
    try {
      const response = await api.post('/scheduling/equipment/', formData);
      console.log('Equipment created:', response.data);
      setFormData({ name: '', category: '', description: '', quantity: '', is_active: true });
      setShowForm(false);
      setError(null);
      fetchData();
    } catch (err) {
      console.error('Error creating equipment:', err.response?.data);
      const errorMessage = err.response?.data?.detail || JSON.stringify(err.response?.data) || 'Failed to create equipment';
      setError(errorMessage);
    }
  };

  const handleDeleteEquipment = async (equipmentId) => {
    if (window.confirm('Are you sure?')) {
      try {
        await api.delete(`/scheduling/equipment/${equipmentId}/`);
        fetchData();
      } catch (err) {
        setError('Failed to delete equipment');
      }
    }
  };

  if (loading) return <div className="feature-landing loading">Loading equipment...</div>;

  return (
    <div className="feature-landing">
      <div className="feature-header">
        <div className="feature-title-section">
          <h1>⚙️ Equipment & Time Slots Management</h1>
          <p className="feature-subtitle">Configure equipment linked to rooms and manage time slot definitions</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Equipment'}
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}

      {showForm && (
        <div className="form-container">
          <form onSubmit={handleCreateEquipment} className="feature-form">
            <div className="form-group">
              <label>Equipment Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Projector, Microscope"
                maxLength="100"
              />
            </div>
            <div className="form-group">
              <label>Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description"
                rows="3"
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                {equipmentCategoryOptions.map(option => (
                  <option key={option.value || 'uncategorized'} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Quantity *</label>
              <input
                type="number"
                required
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder="Number of units"
              />
            </div>
            <div className="form-group">
              <label>
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                />
                {' '}Active
              </label>
            </div>
            <button type="submit" className="btn btn-success">Add Equipment</button>
          </form>
        </div>
      )}

      <div className="feature-stats">
        <div className="stat-card">
          <div className="stat-number">{equipment.length}</div>
          <div className="stat-label">Total Equipment</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{equipment.filter(e => e.status === 'AVAILABLE').length}</div>
          <div className="stat-label">Available</div>
        </div>
      </div>

      <div className="equipment-table">
        {equipment.length === 0 ? (
          <div className="empty-state">
            <p>No equipment found. Add your first equipment!</p>
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Equipment Name</th>
                <th>Category</th>
                <th>Description</th>
                <th>Quantity</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {equipment.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td>{item.category || 'N/A'}</td>
                  <td>{item.description || 'N/A'}</td>
                  <td>{item.quantity}</td>
                  <td>
                    <span className={`status-badge ${item.is_active ? 'active' : 'inactive'}`}>
                      {item.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteEquipment(item.id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="feature-info">
        <h3>About Equipment Management</h3>
        <ul>
          <li>Link equipment to specific rooms for resource tracking</li>
          <li>Track equipment availability and maintenance status</li>
          <li>Manage equipment quantities and allocations</li>
          <li>Time slots are automatically generated based on room availability</li>
        </ul>
      </div>
    </div>
  );
};

export default EquipmentLanding;
