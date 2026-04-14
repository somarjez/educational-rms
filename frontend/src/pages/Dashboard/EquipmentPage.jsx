import React, { useEffect, useState } from 'react';
import { getEquipment } from '../../services/schedulingApi';
import './LandingPages.css';

const toList = (data) => (Array.isArray(data) ? data : data?.results || []);

const EquipmentPage = () => {
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const data = await getEquipment();
        setEquipment(toList(data));
        setError('');
      } catch (err) {
        setEquipment([]);
        setError('Failed to load equipment.');
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, []);

  return (
    <div className="landing-page">
      <div className="landing-header">
        <div>
          <h1 className="landing-title">Equipment</h1>
          <p className="landing-subtitle">Resource inventory and current availability.</p>
        </div>
      </div>

      {loading ? (
        <div className="empty-state">Loading equipment...</div>
      ) : error ? (
        <div className="empty-state">{error}</div>
      ) : equipment.length === 0 ? (
        <div className="empty-state">No equipment found.</div>
      ) : (
        <div className="landing-list">
          <div className="landing-list-header">
            <span>Equipment</span>
            <span>Category</span>
            <span>Quantity</span>
            <span>Status</span>
          </div>
          {equipment.map((item) => (
            <div key={item.id} className="landing-list-item">
              <span>{item.name || 'N/A'}</span>
              <span>{item.category || 'N/A'}</span>
              <span>{item.quantity ?? 'N/A'}</span>
              <span>
                <span className={item.is_available || item.is_active ? 'status-pill status-confirmed' : 'status-pill status-default'}>
                  {item.is_available || item.is_active ? 'Available' : 'In Use'}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EquipmentPage;
