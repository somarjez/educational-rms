import React, { useEffect, useMemo, useState } from 'react';
import { getEquipment } from '../../services/schedulingApi';
import './styles/StudentPages.css';

const normalizeEquipment = (response) => {
  if (Array.isArray(response)) {
    return response;
  }
  if (Array.isArray(response?.results)) {
    return response.results;
  }
  return response ? [response] : [];
};

const StudentEquipmentPage = () => {
  const [equipmentItems, setEquipmentItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEquipment = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await getEquipment({ is_active: true });
        setEquipmentItems(normalizeEquipment(response));
      } catch (fetchError) {
        setError('Unable to load equipment availability right now.');
        setEquipmentItems([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, []);

  const summary = useMemo(() => {
    return equipmentItems.reduce(
      (acc, item) => {
        acc.totalItems += 1;
        acc.availableUnits += Number(item?.available_quantity || 0);
        acc.assignedUnits += Number(item?.assigned_quantity || 0);
        return acc;
      },
      { totalItems: 0, availableUnits: 0, assignedUnits: 0 }
    );
  }, [equipmentItems]);

  return (
    <div className="student-page">
      <div className="student-page-header">
        <div>
          <h1 className="student-page-title">Equipment Availability</h1>
          <p className="student-page-subtitle">View-only availability details for booking decisions.</p>
        </div>
      </div>

      <div className="student-page-card student-grid">
        <div className="student-stat">
          <span className="student-stat-label">Items</span>
          <span className="student-stat-value">{summary.totalItems}</span>
        </div>
        <div className="student-stat">
          <span className="student-stat-label">Available Units</span>
          <span className="student-stat-value">{summary.availableUnits}</span>
        </div>
        <div className="student-stat">
          <span className="student-stat-label">Assigned Units</span>
          <span className="student-stat-value">{summary.assignedUnits}</span>
        </div>
      </div>

      <div className="student-page-card">
        {error && <p className="student-error">{error}</p>}
        {loading ? (
          <p className="student-empty">Loading equipment...</p>
        ) : equipmentItems.length === 0 ? (
          <p className="student-empty">No active equipment is currently available.</p>
        ) : (
          <ul className="student-list">
            {equipmentItems.map((item) => {
              const availableUnits = Number(item?.available_quantity || 0);
              const totalUnits = Number(item?.total_quantity || availableUnits + Number(item?.assigned_quantity || 0));
              const statusText = availableUnits > 0 ? 'Available' : 'Unavailable';
              const statusClass = availableUnits > 0 ? 'student-status-approved' : 'student-status-cancelled';

              return (
                <li className="student-list-item" key={item.id}>
                  <div className="student-list-row">
                    <strong>{item?.name || 'Unnamed Resource'}</strong>
                    <span className={`student-status ${statusClass}`}>{statusText}</span>
                  </div>
                  <p className="student-list-meta">
                    Category: {item?.category || 'N/A'} | Available: {availableUnits} | Total: {totalUnits}
                  </p>
                  <p className="student-list-meta">{item?.description || 'No additional details provided.'}</p>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};

export default StudentEquipmentPage;
