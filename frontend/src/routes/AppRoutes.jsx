import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from '../features/auth/components/Login';
import Register from '../features/auth/components/Register';
import Dashboard from '../features/dashboard/Dashboard';
import AdminScheduling from '../components/Admin/AdminScheduling/AdminScheduling';
import BookingsVisualization from '../components/Bookings/BookingsVisualization';
import MainLayout from '../components/Layout/MainLayout';
import ProtectedRoute from './ProtectedRoute';
import { useAuthStore } from '../stores/authStore';
import BookingsPage from '../pages/Dashboard/BookingsPage';
import PendingRequestsPage from '../pages/Dashboard/PendingRequestsPage';
import SchedulePage from '../pages/Dashboard/SchedulePage';
import EquipmentPage from '../pages/Dashboard/EquipmentPage';
import NotificationsPage from '../pages/Dashboard/NotificationsPage';
import SettingsPage from '../pages/Dashboard/SettingsPage';
import ProfilePage from '../pages/Dashboard/ProfilePage';
import ReportsPage from '../pages/Dashboard/ReportsPage';
import EquipmentRequestPage from '../pages/Dashboard/EquipmentRequestPage';
import AdminEquipmentRequestsPage from '../pages/Dashboard/AdminEquipmentRequestsPage';

// Modeling Components
import ResourceUtilization from '../components/Modeling/ResourceUtilization';
import DemandForecasting from '../components/Modeling/DemandForecasting';
import BookingConflictModel from '../components/Modeling/BookingConflictModel';
import EquipmentUsageModel from '../components/Modeling/EquipmentUsageModel';

// Simulation Components
import RoomUsageSimulation from '../components/Simulation/RoomUsageSimulation';
import EquipmentUsageSimulation from '../components/Simulation/EquipmentUsageSimulation';
import PeakHourScenario from '../components/Simulation/PeakHourScenario';
import ShortageScenario from '../components/Simulation/ShortageScenario';
import WhatIfAnalysis from '../components/Simulation/WhatIfAnalysis';

const AppRoutes = () => {
  const { user, initAuth } = useAuthStore();

  // Initialize auth on component mount (only once)
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Router future={{ v7_relativeSplatPath: true, v7_startTransition: true }}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes with Sidebar */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <MainLayout userRole={user?.role}>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/admin-scheduling"
          element={
            <ProtectedRoute>
              <MainLayout userRole={user?.role}>
                <AdminScheduling />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/bookings"
          element={
            <ProtectedRoute requiredRole={["ADMIN", "FACULTY"]}>
              <MainLayout userRole={user?.role}>
                <BookingsVisualization />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/bookings"
          element={
            <ProtectedRoute>
              <MainLayout userRole={user?.role}>
                <BookingsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/pending-requests"
          element={
            <ProtectedRoute requiredRole={["ADMIN"]}>
              <MainLayout userRole={user?.role}>
                <PendingRequestsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/schedule"
          element={
            <ProtectedRoute>
              <MainLayout userRole={user?.role}>
                <SchedulePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/equipment"
          element={
            <ProtectedRoute>
              <MainLayout userRole={user?.role}>
                <EquipmentPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/equipment/request"
          element={
            <ProtectedRoute>
              <MainLayout userRole={user?.role}>
                <EquipmentRequestPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/equipment-requests"
          element={
            <ProtectedRoute requiredRole={["ADMIN"]}>
              <MainLayout userRole={user?.role}>
                <AdminEquipmentRequestsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <MainLayout userRole={user?.role}>
                <NotificationsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <MainLayout userRole={user?.role}>
                <SettingsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout userRole={user?.role}>
                <ProfilePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/reports"
          element={
            <ProtectedRoute requiredRole={["ADMIN", "FACULTY"]}>
              <MainLayout userRole={user?.role}>
                <ReportsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Modeling Routes */}
        <Route
          path="/modeling/resource-utilization"
          element={
            <ProtectedRoute requiredRole={["ADMIN", "FACULTY"]}>
              <MainLayout userRole={user?.role}>
                <ResourceUtilization />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/modeling/demand-forecasting"
          element={
            <ProtectedRoute requiredRole={["ADMIN", "FACULTY"]}>
              <MainLayout userRole={user?.role}>
                <DemandForecasting />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/modeling/booking-conflict"
          element={
            <ProtectedRoute requiredRole={["ADMIN", "FACULTY"]}>
              <MainLayout userRole={user?.role}>
                <BookingConflictModel />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/modeling/equipment-usage"
          element={
            <ProtectedRoute requiredRole={["ADMIN", "FACULTY"]}>
              <MainLayout userRole={user?.role}>
                <EquipmentUsageModel />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Simulation Routes */}
        <Route
          path="/simulation/room-usage"
          element={
            <ProtectedRoute requiredRole={["ADMIN", "FACULTY"]}>
              <MainLayout userRole={user?.role}>
                <RoomUsageSimulation />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/simulation/equipment-usage"
          element={
            <ProtectedRoute requiredRole={["ADMIN", "FACULTY"]}>
              <MainLayout userRole={user?.role}>
                <EquipmentUsageSimulation />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/simulation/peak-hour"
          element={
            <ProtectedRoute requiredRole={["ADMIN", "FACULTY"]}>
              <MainLayout userRole={user?.role}>
                <PeakHourScenario />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/simulation/shortage"
          element={
            <ProtectedRoute requiredRole={["ADMIN", "FACULTY"]}>
              <MainLayout userRole={user?.role}>
                <ShortageScenario />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/simulation/what-if"
          element={
            <ProtectedRoute requiredRole={["ADMIN", "FACULTY"]}>
              <MainLayout userRole={user?.role}>
                <WhatIfAnalysis />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Feature Landing Pages */}
        <Route
          path="/features/*"
          element={
            <ProtectedRoute>
              <MainLayout userRole={user?.role}>
                <AdminScheduling />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
};

export default AppRoutes;
