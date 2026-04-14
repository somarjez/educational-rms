import React, { useState, lazy, Suspense } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/authStore';
import { DashboardSkeleton } from '../../../components/Skeleton/Skeleton';
import EditProfileModal from '../../../components/Profile/EditProfileModal';
import DashboardHeader from './DashboardHeader';
import WelcomeSection from './WelcomeSection';
import useInactivityLogout from '../../../hooks/useInactivityLogout';
import useDashboardData from '../../../hooks/booking/useDashboardData';
import ErrorMessage from '../../../components/Error/ErrorMessage';
import './styles/Dashboard.css';

const DashboardCards = lazy(() => import('../stats/DashboardCards'));
const RecentActivity = lazy(() => import('../activity/RecentActivity'));
const QuickActions = lazy(() => import('../actions/QuickActions'));
const MiniCalendar = lazy(() => import('../calendar/MiniCalendar'));
const UpcomingSchedule = lazy(() => import('../sections/UpcomingSchedule'));
const NotificationPreview = lazy(() => import('../sections/NotificationPreview'));
const EquipmentPreview = lazy(() => import('../sections/EquipmentPreview'));
const DecisionSupportPanel = lazy(() => import('../sections/DecisionSupportPanel'));
const FacultyDashboardLayout = lazy(() => import('../sections/FacultyDashboardLayout'));
const AdminDashboardLayout = lazy(() => import('../sections/AdminDashboardLayout'));

const Dashboard = () => {
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  useInactivityLogout(logout, navigate);
  const { dashboardData, loading, error, refreshDashboard } = useDashboardData(user, navigate);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleProfileUpdate = async (updatedUser) => {
    // Refresh user data in the auth store
    // ...existing code...
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
  const normalizedRole = String(userData.role || '').toUpperCase();
  const isAdmin = normalizedRole === 'ADMIN' || normalizedRole === 'FACULTY';
  const isAdminUser = normalizedRole === 'ADMIN';
  const isFacultyUser = normalizedRole === 'FACULTY';

  return (
    <div className="dashboard">
      <DashboardHeader
        user={userData}
        onLogout={handleLogout}
        onProfileClick={() => navigate('/profile')}
      />

      <div className="dashboard-content">
        <WelcomeSection userName={userData.first_name || userData.username} />

        <Suspense fallback={<div className="loading">Loading dashboard sections...</div>}>
          <DashboardCards
            bookingStats={booking_stats}
            simulationStats={simulation_stats}
          />

          <DecisionSupportPanel userRole={userData.role} showViewDetails />

          {/* Admin/Faculty Scheduling Stats - Only for admins/faculty */}
          {isAdmin && (
            <>
              {scheduling_stats && (
                <>
                  {isFacultyUser && (
                    <FacultyDashboardLayout schedulingStats={scheduling_stats} />
                  )}
                </>
              )}
              {isAdminUser && (
                <AdminDashboardLayout
                  bookingStats={booking_stats}
                  schedulingStats={scheduling_stats || {}}
                  recentBookings={recent_bookings}
                />
              )}
            </>
          )}

          <div className="content-sections">
            {isAdminUser ? (
              <>
                <MiniCalendar />
                <RecentActivity bookings={recent_bookings} userRole={userData.role} />
              </>
            ) : isFacultyUser ? (
              <>
                <MiniCalendar />
                <RecentActivity bookings={recent_bookings} userRole={userData.role} />
                <NotificationPreview bookings={recent_bookings} />
                <EquipmentPreview />
              </>
            ) : (
              <>
                <RecentActivity bookings={recent_bookings} userRole={userData.role} />
                <UpcomingSchedule />
                <NotificationPreview bookings={recent_bookings} />
                <EquipmentPreview />
              </>
            )}

            <QuickActions
              onEditProfile={() => setIsEditProfileOpen(true)}
              userRole={userData.role}
              onBookingCreated={refreshDashboard}
            />
          </div>
        </Suspense>
      </div>

      <EditProfileModal 
        isOpen={isEditProfileOpen} 
        onClose={() => setIsEditProfileOpen(false)} 
        onUpdate={handleProfileUpdate} 
      />
    </div>
  );
};

export default Dashboard;

