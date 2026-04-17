import React, { useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const ProtectedRoute = ({ children, requiredRole }) => {
  const { isAuthenticated, initAuth, user, hasInitialized, isInitializing } = useAuthStore();

  useEffect(() => {
    if (!hasInitialized && !isInitializing) {
      initAuth();
    }
  }, [hasInitialized, isInitializing, initAuth]);

  // Show loading while initializing
  if (!hasInitialized || isInitializing) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100vh',
        background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)'
      }}>
        <div style={{
          textAlign: 'center'
        }}>
          <div style={{
            width: '60px',
            height: '60px',
            border: '4px solid #e2e8f0',
            borderTopColor: '#2563eb',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem'
          }} />
          <p>Loading...</p>
          <style>{`
            @keyframes spin {
              to {
                transform: rotate(360deg);
              }
            }
          `}</style>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (requiredRole) {
    const userRole = user?.role?.toUpperCase() || '';
    const allowedRoles = Array.isArray(requiredRole) 
      ? requiredRole.map(r => r.toUpperCase())
      : [requiredRole.toUpperCase()];
    
    if (!allowedRoles.includes(userRole)) {
      return (
        <Navigate to="/dashboard" replace />
      );
    }
  }

  return children;
};

export default ProtectedRoute;
