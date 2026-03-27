import React from 'react';
import { useNavigate } from 'react-router-dom';
import QuickCreateBooking from './QuickCreateBooking';
import NewBookingAction from './QuickActions/NewBookingAction';
import RunSimulationAction from './QuickActions/RunSimulationAction';
import EditProfileAction from './QuickActions/EditProfileAction';
import AdminSchedulingAction from './QuickActions/AdminSchedulingAction';
import useBookingModal from '../../../hooks/useBookingModal';
import styles from './styles/QuickActions.module.css';

const QuickActions = ({ onEditProfile, userRole, onBookingCreated }) => {
  const navigate = useNavigate();
  const normalizedRole = userRole?.toUpperCase?.() || '';
  const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'FACULTY';
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
          {isAdmin && (
            <RunSimulationAction onClick={() => navigate('/simulation/what-if')} />
          )}
          <EditProfileAction onClick={onEditProfile} />
          {isAdmin && (
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
