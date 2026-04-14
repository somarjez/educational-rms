import React from 'react';
import { useNavigate } from 'react-router-dom';
import QuickCreateBooking from './QuickCreateBooking';
import NewBookingAction from './QuickActions/NewBookingAction';
import RequestEquipmentAction from './QuickActions/RequestEquipmentAction';
import RunSimulationAction from './QuickActions/RunSimulationAction';
import EditProfileAction from './QuickActions/EditProfileAction';
import AdminSchedulingAction from './QuickActions/AdminSchedulingAction';
import DisplayUtilizationChartsAction from './QuickActions/DisplayUtilizationChartsAction';
import useBookingModal from '../../../hooks/useBookingModal';
import styles from './styles/QuickActions.module.css';

const QuickActions = ({ onEditProfile, userRole, onBookingCreated }) => {
  const navigate = useNavigate();
  const normalizedRole = String(userRole || '').toUpperCase();
  const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'FACULTY';
  const isAdminUser = normalizedRole === 'ADMIN';
  const { showCreateBooking, openModal, closeModal } = useBookingModal();

  const handleBookingCreated = () => {
    closeModal();
    if (onBookingCreated) onBookingCreated();
  };

  return (
    <>
      <div className={styles.sectionCard}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
        </div>
        <div className={styles.quickActions}>
          <NewBookingAction onClick={openModal} />
          <RequestEquipmentAction onClick={() => navigate('/equipment/request')} />
          {isAdmin && (
            <RunSimulationAction onClick={() => navigate('/simulation/room-usage')} />
          )}
          {isAdmin && (
            <DisplayUtilizationChartsAction onClick={() => navigate('/modeling/resource-utilization')} />
          )}
          <EditProfileAction onClick={onEditProfile} />
          {isAdminUser && (
            <AdminSchedulingAction onClick={() => navigate('/admin-scheduling')} />
          )}
        </div>
      </div>

      {showCreateBooking && (
        <QuickCreateBooking
          onCreated={handleBookingCreated}
          onClose={closeModal}
        />
      )}
    </>
  );
};

export default QuickActions;
