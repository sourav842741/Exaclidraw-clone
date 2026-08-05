import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '../api/index.js';

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      loading: false,

      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),
      setUser: (user) => set({ user }),

      register: async (payload) => {
        set({ loading: true });
        try {
          const data = await authApi.register(payload);
          set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, loading: false });
          return { ok: true };
        } catch (err) {
          set({ loading: false });
          return { ok: false, error: err.response?.data?.message || 'Registration failed' };
        }
      },

      login: async (payload) => {
        set({ loading: true });
        try {
          const data = await authApi.login(payload);
          set({ user: data.user, accessToken: data.accessToken, refreshToken: data.refreshToken, loading: false });
          return { ok: true };
        } catch (err) {
          set({ loading: false });
          return { ok: false, error: err.response?.data?.message || 'Login failed' };
        }
      },

      logout: async () => {
        const refreshToken = get().refreshToken;
        if (refreshToken) authApi.logout(refreshToken).catch(() => {});
        set({ user: null, accessToken: null, refreshToken: null });
      },

      verifyEmail: async (token) => {
        await authApi.verifyEmail(token);
        const { user } = get();
        if (user) set({ user: { ...user, isEmailVerified: true } });
        return { ok: true };
      },

      isAuthenticated: () => !!get().accessToken,
      isAdmin: () => get().user?.role === 'admin',
    }),
    {
      name: 'vectorshare-auth',
      partialize: (s) => ({ user: s.user, accessToken: s.accessToken, refreshToken: s.refreshToken }),
    },
  ),
);
