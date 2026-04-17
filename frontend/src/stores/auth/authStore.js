import { create } from 'zustand';
import { authApi } from '../../services/authApi';

export const useAuthStore = create((set) => ({
  user: null,
  tokens: {
    access: null,
    refresh: null,
  },
  isLoading: false,
  error: null,
  isAuthenticated: false,
  lastActivityTime: Date.now(),

  // Initialize auth from localStorage
  initAuth: async () => {
    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');
    if (access && refresh) {
      set({ tokens: { access, refresh }, isAuthenticated: true });
      try {
        const user = await authApi.getCurrentUser();
        set({ user });
      } catch (err) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({ tokens: { access: null, refresh: null }, isAuthenticated: false, user: null });
      }
    }
  },
  // ...existing code...
})
);
