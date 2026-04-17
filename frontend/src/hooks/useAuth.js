import React, { useEffect } from 'react';
import useAuthStore from '../stores/authStore';

export const useAuth = (autoInit = true) => {
  const {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    initAuth,
    clearError,
    changePassword,
  } = useAuthStore();

  useEffect(() => {
    if (autoInit) {
      initAuth();
    }
  }, [autoInit, initAuth]);

  return {
    user,
    isAuthenticated,
    isLoading,
    error,
    login,
    logout,
    register,
    clearError,
    changePassword,
  };
};

export default useAuth;
