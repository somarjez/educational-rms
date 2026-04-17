import React from 'react';
import { useNavigate } from 'react-router-dom';
import QuickCreateBooking from './QuickCreateBooking';
import NewBookingAction from './QuickActions/NewBookingActionClean';
import RequestEquipmentAction from './QuickActions/RequestEquipmentActionClean';
import RunSimulationAction from './QuickActions/RunSimulationActionClean';
import EditProfileAction from './QuickActions/EditProfileActionClean';
import AdminSchedulingAction from './QuickActions/AdminSchedulingActionClean';
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
          <span className={styles.headerIcon} aria-hidden="true">➤</span>
          <h2 className={styles.sectionTitle}>Quick Actions</h2>
        </div>
        <div className={styles.quickActions}>
          <NewBookingAction onClick={openModal} />
          <EditProfileAction onClick={onEditProfile} />
          <RequestEquipmentAction onClick={() => navigate('/equipment/request')} />
          {isAdmin && (
            <RunSimulationAction onClick={() => navigate('/simulation/room-usage')} />
          )}
          {isAdminUser && (
            <AdminSchedulingAction onClick={() => navigate('/admin-scheduling')} />
          )}
          {isAdmin && (
            <DisplayUtilizationChartsAction onClick={() => navigate('/modeling/resource-utilization')} />
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
