import { useEffect, useRef } from 'react';

const useInactivityLogout = (logout, navigate, timeout = 10 * 60 * 1000) => {
  const inactivityTimerRef = useRef(null);

  const resetInactivityTimer = () => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
    }
    inactivityTimerRef.current = setTimeout(() => {
      logout();
      navigate('/login');
    }, timeout);
  };

  useEffect(() => {
    // Reset timer on any user activity
    const handleActivity = () => {
      resetInactivityTimer();
    };

    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('keypress', handleActivity);
    document.addEventListener('click', handleActivity);
    document.addEventListener('scroll', handleActivity);

    resetInactivityTimer();

    return () => {
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('keypress', handleActivity);
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('scroll', handleActivity);
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
    };
  }, [logout, navigate, timeout]);
};

export default useInactivityLogout;
