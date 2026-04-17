import { useEffect, useState } from 'react';
import api from '../../services/api';

const DASHBOARD_CACHE_TTL_MS = 30 * 1000;
const dashboardMemoryCache = new Map();

const getCacheKey = (user) => `${user?.id || 'anon'}:${user?.role || 'UNKNOWN'}`;

const useDashboardData = (user, navigate) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const cacheKey = getCacheKey(user);
    const cached = dashboardMemoryCache.get(cacheKey);
    if (cached && Date.now() - cached.ts < DASHBOARD_CACHE_TTL_MS) {
      setDashboardData(cached.data);
      setLoading(false);
    }

    const fetchDashboardData = async () => {
      try {
        const response = await api.get('/auth/dashboard/stats/');
        setDashboardData(response.data);
        dashboardMemoryCache.set(cacheKey, { data: response.data, ts: Date.now() });
        setError(null);
      } catch (err) {
        setError('Failed to load dashboard data');
        console.error('Dashboard error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, [user, navigate]);

  const refreshDashboard = async () => {
    try {
      const cacheKey = getCacheKey(user);
      const response = await api.get('/auth/dashboard/stats/');
      setDashboardData(response.data);
      dashboardMemoryCache.set(cacheKey, { data: response.data, ts: Date.now() });
    } catch (err) {
      console.error('Failed to refresh dashboard:', err);
    }
  };

  return { dashboardData, loading, error, refreshDashboard };
};

export default useDashboardData;
