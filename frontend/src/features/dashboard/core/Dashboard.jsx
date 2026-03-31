import React, { useEffect, useState, lazy, Suspense } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { DashboardSkeleton } from '../../../components/Skeleton/Skeleton';
import EditProfileModal from '../../../components/Profile/EditProfileModal';
import DashboardHeader from './DashboardHeader';
import WelcomeSection from './WelcomeSection';
import useInactivityLogout from '../../../hooks/useInactivityLogout';
import useDashboardData from '../../../hooks/booking/useDashboardData';
import ErrorMessage from '../../../components/Error/ErrorMessage';
import { getEquipment } from '../../../services/schedulingApi';
import './styles/Dashboard.css';

const DashboardCards = lazy(() => import('../stats/DashboardCards'));
const RecentActivity = lazy(() => import('../activity/RecentActivity'));
const QuickActions = lazy(() => import('../actions/QuickActions'));
const AdminSchedulingStats = lazy(() => import('../admin/AdminSchedulingStats'));
const MiniCalendar = lazy(() => import('../calendar/MiniCalendar'));

const getNotifications = (bookings = []) => {
  const statusText = {
    PENDING: 'Pending review',
    APPROVED: 'Approved',
    CONFIRMED: 'Confirmed',
    REJECTED: 'Rejected',
    CANCELLED: 'Cancelled',
  };

  return bookings.slice(0, 5).map((booking) => ({
    id: booking.id,
    title: booking.purpose || 'Booking update',
    message: `${booking.room_name} • ${statusText[booking.status] || booking.status}`,
    date: booking.date,
  }));
};

const Dashboard = () => {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [equipmentSummary, setEquipmentSummary] = useState({
    totalItems: 0,
    availableUnits: 0,
    assignedUnits: 0,
  });
  const [equipmentLoading, setEquipmentLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  useInactivityLogout(logout, navigate);
  const { dashboardData, loading, error, refreshDashboard } = useDashboardData(user, navigate);
  const normalizedUserRole = user?.role?.toUpperCase?.() || '';
  const isAdminLikeUser = normalizedUserRole === 'ADMIN' || normalizedUserRole === 'FACULTY';

  useEffect(() => {
    if ((location.pathname === '/profile' && isAdminLikeUser) || location.state?.openProfile) {
      setIsEditProfileOpen(true);
    }
  }, [isAdminLikeUser, location.pathname, location.state]);

  useEffect(() => {
    const requestedSection = location.state?.section;
    if (!requestedSection) {
      return;
    }

    const normalizedRole = user?.role?.toUpperCase?.() || '';
    const isAdminLike = normalizedRole === 'ADMIN' || normalizedRole === 'FACULTY';

    if (requestedSection === 'settings') {
      if (isAdminLike) {
        handleProfileNavigate();
      } else {
        navigate('/student/settings');
      }
      return;
    }

    if (requestedSection === 'bookings' && isAdminLike) {
      navigate('/bookings');
      return;
    }

    if (requestedSection === 'schedule' && isAdminLike) {
      navigate('/admin-scheduling', { state: { tab: 'calendar' } });
      return;
    }

    const panelBySection = {
      bookings: 'bookings-panel',
      schedule: 'schedule-panel',
      equipment: 'equipment-panel',
      notifications: 'notifications-panel',
    };

    const panelId = panelBySection[requestedSection];
    if (panelId) {
      requestAnimationFrame(() => {
        const sectionElement = document.getElementById(panelId);
        if (sectionElement) {
          sectionElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      });
    }
  }, [location.state, navigate, user?.role]);

  useEffect(() => {
    const fetchEquipmentSummary = async () => {
      setEquipmentLoading(true);
      try {
        const response = await getEquipment({ is_active: true });
        const equipmentList = Array.isArray(response) ? response : (response?.results || []);

        const summary = equipmentList.reduce((acc, item) => {
          acc.totalItems += 1;
          acc.availableUnits += Number(item.available_quantity || 0);
          acc.assignedUnits += Number(item.assigned_quantity || 0);
          return acc;
        }, { totalItems: 0, availableUnits: 0, assignedUnits: 0 });

        setEquipmentSummary(summary);
      } catch (equipmentError) {
        setEquipmentSummary({ totalItems: 0, availableUnits: 0, assignedUnits: 0 });
      } finally {
        setEquipmentLoading(false);
      }
    };

    fetchEquipmentSummary();
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileUpdate = async () => {
    try {
      await refreshDashboard();
    } catch (error) {
      await refreshDashboard();
    }
  };

  const handleProfileNavigate = () => {
    if (isAdminLikeUser) {
      navigate('/profile', { state: { openProfile: true } });
      return;
    }

    navigate('/student/profile');
  };

  const handleCloseProfileModal = () => {
    setIsEditProfileOpen(false);
    if (location.pathname === '/profile') {
      navigate('/dashboard', { replace: true });
    }
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (!dashboardData) {
    return (
      <div className="dashboard">
        <ErrorMessage message={error} />
      </div>
    );
  }

  const { user: userData, booking_stats, recent_bookings, simulation_stats, scheduling_stats } = dashboardData;
  const normalizedRole = userData?.role?.toUpperCase?.() || '';
  const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'FACULTY';
  const notifications = getNotifications(recent_bookings);

  return (
    <div className="dashboard">
      <DashboardHeader user={userData} onLogout={handleLogout} onProfileClick={handleProfileNavigate} />

      <div className="dashboard-content">
        <WelcomeSection userName={userData.first_name || userData.username} />

        <Suspense fallback={<div className="loading">Loading dashboard sections...</div>}>
          <DashboardCards
            bookingStats={booking_stats}
            simulationStats={simulation_stats}
          />

          {/* Admin Scheduling Stats - Only for admins/faculty */}
          {isAdmin && scheduling_stats && (
            <AdminSchedulingStats
              schedulingStats={scheduling_stats}
              onBookingUpdate={refreshDashboard}
              userRole={userData.role}
            />
          )}

          <div className="dashboard-row-two">
            <MiniCalendar userRole={userData.role} user={userData} />

            <div className="section-card equipment-card" id="equipment-panel">
              <div className="section-header">
                <h2 className="section-title">Equipment Availability</h2>
              </div>
              {equipmentLoading ? (
                <p className="equipment-loading">Loading equipment...</p>
              ) : (
                <div className="equipment-summary-grid">
                  <div className="equipment-metric">
                    <span className="equipment-metric-label">Total Items</span>
                    <span className="equipment-metric-value">{equipmentSummary.totalItems}</span>
                  </div>
                  <div className="equipment-metric">
                    <span className="equipment-metric-label">Available Units</span>
                    <span className="equipment-metric-value">{equipmentSummary.availableUnits}</span>
                  </div>
                  <div className="equipment-metric">
                    <span className="equipment-metric-label">Assigned Units</span>
                    <span className="equipment-metric-value">{equipmentSummary.assignedUnits}</span>
                  </div>
                </div>
              )}
            </div>

            <QuickActions
              onEditProfile={handleProfileNavigate}
              userRole={userData.role}
              onBookingCreated={refreshDashboard}
            />
          </div>

          <div className="dashboard-row-three">
            <div className="section-card" id="notifications-panel">
              <div className="section-header">
                <h2 className="section-title">Notifications</h2>
              </div>
              {notifications.length > 0 ? (
                <ul className="notification-list">
                  {notifications.map((notification) => (
                    <li key={notification.id} className="notification-item">
                      <p className="notification-title">{notification.title}</p>
                      <p className="notification-message">{notification.message}</p>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="notification-empty">No new notifications.</p>
              )}
            </div>

            <div className="section-card compact-panel">
              <div className="section-header">
                <h2 className="section-title">View All</h2>
              </div>
              <p className="compact-panel-text">
                View complete booking details and status history.
              </p>
              <button
                className="view-all-btn"
                onClick={() => navigate(isAdmin ? '/bookings' : '/student/bookings')}
              >
                View All
              </button>
            </div>
          </div>

          <div className="dashboard-row-legacy">
            <div id="bookings-panel">
              <RecentActivity bookings={recent_bookings} userRole={userData.role} />
            </div>
          </div>
        </Suspense>
      </div>

      <EditProfileModal 
        isOpen={isEditProfileOpen} 
        onClose={handleCloseProfileModal} 
        onUpdate={handleProfileUpdate} 
      />
    </div>
  );
};

export default Dashboard;

