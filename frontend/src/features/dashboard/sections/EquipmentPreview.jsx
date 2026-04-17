import React, { useState, useEffect } from 'react';
import { FiTool, FiArrowRight } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import { getEquipment } from '../../../services/schedulingApi';
import styles from './styles/ScheduleSections.module.css';

const EquipmentPreview = () => {
  const navigate = useNavigate();
  const [equipment, setEquipment] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true);
        const data = await getEquipment({ limit: 6 });
        setEquipment(Array.isArray(data) ? data : data.results || []);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch equipment:', err);
        setError('Failed to load equipment');
        setEquipment([]);
      } finally {
        setLoading(false);
      }
    };

    fetchEquipment();
  }, []);

  const availableCount = equipment.filter((item) => item.is_available).length;
  const inUseCount = Math.max(equipment.length - availableCount, 0);
  const uniqueCategories = new Set(
    equipment
      .map((item) => item.category)
      .filter((category) => typeof category === 'string' && category.trim().length > 0)
  ).size;

  return (
    <div className={styles.equipmentCard}>
      <div className={styles.equipmentHeader}>
        <h3 className={styles.equipmentTitle}>
          <FiTool className={styles.icon} />
          Available Equipment
        </h3>
        <button
          className={styles.viewAllLink}
          onClick={() => navigate('/equipment')}
          title="View all equipment"
        >
          View All <FiArrowRight />
        </button>
      </div>

      <div className={styles.equipmentList}>
        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.skeleton}>Loading...</div>
          </div>
        ) : equipment.length > 0 ? (
          <div className={styles.equipmentOverview}>
            <div className={styles.equipmentOverviewItem}>
              <span className={styles.overviewLabel}>Total Tracked</span>
              <span className={styles.overviewValue}>{equipment.length}</span>
            </div>
            <div className={styles.equipmentOverviewItem}>
              <span className={styles.overviewLabel}>Available</span>
              <span className={styles.overviewValue}>{availableCount}</span>
            </div>
            <div className={styles.equipmentOverviewItem}>
              <span className={styles.overviewLabel}>In Use</span>
              <span className={styles.overviewValue}>{inUseCount}</span>
            </div>
            <div className={styles.equipmentOverviewItem}>
              <span className={styles.overviewLabel}>Categories</span>
              <span className={styles.overviewValue}>{uniqueCategories}</span>
            </div>
            <p className={styles.equipmentOverviewHint}>
              Full item names, categories, and status details are available in View All.
            </p>
          </div>
        ) : (
          <div className={styles.emptyState}>
            <FiTool className={styles.emptyIcon} />
            <p>No equipment available</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EquipmentPreview;
