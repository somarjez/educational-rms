import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { getEquipment } from '../../services/schedulingApi';
import DashboardHeader from '../../features/dashboard/core/DashboardHeader';
import './LandingPages.css';
import './EquipmentRequestPages.css';
import './EquipmentPage.css';

const toList = (data) => (Array.isArray(data) ? data : data?.results || []);
const CATEGORY_TABS = ['All', 'Computing', 'Lab', 'Audio-Visual', 'Communication', 'Interactive', 'Furniture'];
const normalizeCategory = (category) => String(category || '').trim().toLowerCase();

const getTotalQuantity = (item) => item.quantity ?? item.total_quantity ?? item.total ?? 0;
const getAvailableQuantity = (item) =>
  item.available_quantity ?? item.available ?? item.available_count ?? getTotalQuantity(item);

const EquipmentPage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [equipment, setEquipment] = useState([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

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

  const categoryTabs = useMemo(() => {
    const configuredTabs = new Set(CATEGORY_TABS.map(normalizeCategory));
    const dataTabs = equipment
      .map((item) => String(item.category || '').trim())
      .filter(Boolean)
      .filter((category) => !configuredTabs.has(normalizeCategory(category)));

    return [...CATEGORY_TABS, ...new Set(dataTabs)];
  }, [equipment]);

  const visibleEquipment = useMemo(() => {
    if (activeCategory === 'All') return equipment;
    return equipment.filter((item) => normalizeCategory(item.category) === normalizeCategory(activeCategory));
  }, [activeCategory, equipment]);

  return (
    <div className="landing-page equipment-request-page equipment-management-page">
      <DashboardHeader
        user={user || { role: 'User' }}
        onLogout={handleLogout}
        onProfileClick={() => navigate('/profile')}
      />

      <div className="equipment-request-content equipment-management-content">
        <div className="landing-header equipment-heading">
          <div>
            <h1 className="landing-title equipment-title">EQUIPMENT</h1>
            <p className="landing-subtitle equipment-subtitle">Resource inventory currently available.</p>
          </div>

          <button
            type="button"
            className="btn btn-primary equipment-request-trigger equipment-request-button"
            onClick={() => navigate('/equipment/request')}
          >
            <span aria-hidden="true">+</span>
            NEW EQUIPMENT REQUEST
          </button>
        </div>

        <div className="equipment-category-filters equipment-category-tabs" aria-label="Equipment categories">
          {categoryTabs.map((category) => (
            <button
              key={category}
              type="button"
              className={`category-tab equipment-category-tab ${activeCategory === category ? 'active' : ''}`}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="empty-state">Loading equipment...</div>
        ) : error ? (
          <div className="empty-state">{error}</div>
        ) : visibleEquipment.length === 0 ? (
          <div className="empty-state">No equipment found.</div>
        ) : (
          <div className="landing-list equipment-available-list equipment-inventory-table" role="table" aria-label="Equipment inventory">
            <div className="landing-list-header equipment-table-row equipment-table-header" role="row">
              <span role="columnheader">Equipment</span>
              <span role="columnheader">Category</span>
              <span role="columnheader">Available</span>
              <span role="columnheader">Total</span>
            </div>
            {visibleEquipment.map((item) => (
              <div key={item.id} className="landing-list-item equipment-table-row" role="row">
                <span role="cell">{item.name || 'N/A'}</span>
                <span role="cell">{item.category || 'N/A'}</span>
                <span role="cell">{getAvailableQuantity(item)}</span>
                <span role="cell">{getTotalQuantity(item)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentPage;
