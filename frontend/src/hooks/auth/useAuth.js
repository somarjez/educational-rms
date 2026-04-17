import { useEffect } from 'react';
import useAuthStore from '../../stores/authStore';

export const useAuth = () => {
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
    initAuth();
  }, []);

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
