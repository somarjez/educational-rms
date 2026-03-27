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
import PendingApprovalRequestsPage from '../pages/Admin/PendingApprovalRequestsPage';
import StudentBookingsPage from '../pages/Student/StudentBookingsPage';
import StudentSchedulePage from '../pages/Student/StudentSchedulePage';
import StudentEquipmentPage from '../pages/Student/StudentEquipmentPage';
import StudentNotificationsPage from '../pages/Student/StudentNotificationsPage';
import StudentSettingsPage from '../pages/Student/StudentSettingsPage';
import StudentProfilePage from '../pages/Student/StudentProfilePage';

const AppRoutes = () => {
  const { user, initAuth } = useAuthStore();

  // Initialize auth on component mount (only once)
  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <Router>
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
            <ProtectedRoute requiredRole={["ADMIN", "FACULTY"]}>
              <MainLayout userRole={user?.role}>
                <AdminScheduling />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <MainLayout userRole={user?.role}>
                <Dashboard />
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
          path="/approval-requests"
          element={
            <ProtectedRoute requiredRole={["ADMIN"]}>
              <MainLayout userRole={user?.role}>
                <PendingApprovalRequestsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/bookings"
          element={
            <ProtectedRoute requiredRole={["STUDENT"]}>
              <MainLayout userRole={user?.role}>
                <StudentBookingsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/schedule"
          element={
            <ProtectedRoute requiredRole={["STUDENT"]}>
              <MainLayout userRole={user?.role}>
                <StudentSchedulePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/equipment"
          element={
            <ProtectedRoute requiredRole={["STUDENT"]}>
              <MainLayout userRole={user?.role}>
                <StudentEquipmentPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/notifications"
          element={
            <ProtectedRoute requiredRole={["STUDENT"]}>
              <MainLayout userRole={user?.role}>
                <StudentNotificationsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/settings"
          element={
            <ProtectedRoute requiredRole={["STUDENT"]}>
              <MainLayout userRole={user?.role}>
                <StudentSettingsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/student/profile"
          element={
            <ProtectedRoute requiredRole={["STUDENT"]}>
              <MainLayout userRole={user?.role}>
                <StudentProfilePage />
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
            <ProtectedRoute requiredRole={["ADMIN", "FACULTY"]}>
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
