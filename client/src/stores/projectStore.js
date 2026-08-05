import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useProjectStore = create(
  persist(
    (set) => ({
      projects: [],
      kanban: null,
      activeProject: null,
      activeTask: null,
      boardFilter: 'all',

      setProjects: (projects) => set({ projects }),
      setKanban: (kanban) => set({ kanban }),
      setActiveProject: (project) => set({ activeProject: project }),
      setActiveTask: (task) => set({ activeTask: task }),
      setBoardFilter: (boardFilter) => set({ boardFilter }),

      updateTask: (taskId, patch) =>
        set((s) => {
          if (!s.kanban) return s;
          return {
            kanban: {
              ...s.kanban,
              tasks: s.kanban.tasks.map((t) => (t.id === taskId ? { ...t, ...patch } : t)),
            },
          };
        }),

      clear: () => set({ projects: [], kanban: null, activeProject: null, activeTask: null }),
    }),
    {
      name: 'vectorshare-project',
      partialize: (s) => ({ boardFilter: s.boardFilter }),
    },
  ),
);
