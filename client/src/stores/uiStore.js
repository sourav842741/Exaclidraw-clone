import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUIStore = create(
  persist(
    (set, get) => ({
      theme: 'system',
      sidebarOpen: true,
      activeModal: null,
      modalProps: {},

      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      openModal: (name, props = {}) => set({ activeModal: name, modalProps: props }),
      closeModal: () => set({ activeModal: null, modalProps: {} }),
    }),
    {
      name: 'vectorshare-ui',
      partialize: (s) => ({ theme: s.theme }),
    },
  ),
);

export function applyTheme(theme, systemDark) {
  const root = document.documentElement;
  const dark = theme === 'dark' || (theme === 'system' && systemDark);
  root.classList.toggle('dark', dark);
}
