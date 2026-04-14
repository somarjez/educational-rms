import { create } from 'zustand';
import { authApi } from '../services/authApi';

const extractErrorMessage = (error, fallback) => {
  const data = error?.response?.data || error;

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  if (data?.error) {
    return data.error;
  }

  if (data?.detail) {
    return data.detail;
  }

  if (Array.isArray(data?.non_field_errors) && data.non_field_errors[0]) {
    return data.non_field_errors[0];
  }

  if (Array.isArray(data?.password) && data.password[0]) {
    return data.password[0];
  }

  if (Array.isArray(data?.email) && data.email[0]) {
    return data.email[0];
  }

  if (error?.message) {
    return error.message;
  }

  return fallback;
};

export const useAuthStore = create((set, get) => ({
  user: null,
  tokens: {
    access: null,
    refresh: null,
  },
  isLoading: false,
  error: null,
  isAuthenticated: false,
  isInitializing: false,
  hasInitialized: false,
  lastActivityTime: Date.now(), // Track last activity time

  // Initialize auth from localStorage
  initAuth: async () => {
    if (get().isInitializing || get().hasInitialized) {
      return;
    }

    set({ isInitializing: true });

    const access = localStorage.getItem('access_token');
    const refresh = localStorage.getItem('refresh_token');

    if (access && refresh) {
      set({
        tokens: { access, refresh },
        isAuthenticated: true,
      });

      try {
        const user = await authApi.getCurrentUser();
        set({ user, hasInitialized: true, isInitializing: false });
      } catch (err) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        set({
          tokens: { access: null, refresh: null },
          isAuthenticated: false,
          user: null,
          hasInitialized: true,
          isInitializing: false,
        });
      }
    } else {
      set({ hasInitialized: true, isInitializing: false });
    }
  },

  // Register new user
  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.register(userData);
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);

      set({
        user: data.user,
        tokens: {
          access: data.tokens.access,
          refresh: data.tokens.refresh,
        },
        isAuthenticated: true,
        isLoading: false,
        hasInitialized: true,
      });

      return data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error, 'Registration failed');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Login user
  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.login(email, password);
      localStorage.setItem('access_token', data.tokens.access);
      localStorage.setItem('refresh_token', data.tokens.refresh);

      set({
        user: data.user,
        tokens: {
          access: data.tokens.access,
          refresh: data.tokens.refresh,
        },
        isAuthenticated: true,
        isLoading: false,
        hasInitialized: true,
        isInitializing: false,
      });

      return data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error, 'Login failed');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Logout user
  logout: async () => {
    set({ isLoading: true, error: null });
    try {
      await authApi.logout();
    } catch (err) {
      // Ignore errors during logout
    }

    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');

    set({
      user: null,
      tokens: { access: null, refresh: null },
      isAuthenticated: false,
      isLoading: false,
      hasInitialized: true,
      isInitializing: false,
    });
  },

  // Change password
  changePassword: async (oldPassword, newPassword, newPasswordConfirm) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authApi.changePassword(oldPassword, newPassword, newPasswordConfirm);
      set({ isLoading: false });
      return data;
    } catch (error) {
      const errorMessage = extractErrorMessage(error, 'Password change failed');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // Clear error
  clearError: () => set({ error: null }),
}));

export default useAuthStore;
