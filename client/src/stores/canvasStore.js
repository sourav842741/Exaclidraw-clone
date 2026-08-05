import { create } from 'zustand';

const uuidv4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

export const TOOLS = [
  'selection', 'pan', 'pencil', 'pen', 'marker', 'highlighter', 'eraser',
  'rectangle', 'circle', 'ellipse', 'diamond', 'triangle',
  'arrow', 'curveArrow', 'line', 'polyline', 'text', 'sticky',
  'image', 'emoji', 'icon', 'frame', 'comment',
];

export const useCanvasStore = create((set, get) => ({
  boardId: null,
  ydoc: null,
  setYdoc: (ydoc) => set({ ydoc }),
  elements: [],
  selectedIds: [],
  tool: 'selection',
  strokeColor: '#1e293b',
  fillColor: 'transparent',
  strokeWidth: 2,
  fontFamily: 'Inter, sans-serif',
  fontSize: 18,
  viewport: { x: 0, y: 0, scale: 1 },
  gridEnabled: true,
  snapToGrid: true,
  gridSize: 20,
  gridColor: '#e2e8f0',
  showGrid: true,
  zoomLevel: 1,
  fullscreen: false,
  clipboard: [],
  history: [],
  historyIndex: -1,
  showMinimap: true,
  showLayers: true,
  alignmentGuides: [],
  groupIds: [],
  collaboratorCursor: null,
  presence: [],

  setBoardId: (boardId) => set({ boardId }),
  setTool: (tool) => set({ tool }),
  setStrokeColor: (strokeColor) => set({ strokeColor }),
  setFillColor: (fillColor) => set({ fillColor }),
  setStrokeWidth: (strokeWidth) => set({ strokeWidth }),
  setFontSize: (fontSize) => set({ fontSize }),
  setFontFamily: (fontFamily) => set({ fontFamily }),
  setGridEnabled: (gridEnabled) => set({ gridEnabled }),
  setSnapToGrid: (snapToGrid) => set({ snapToGrid }),
  setShowGrid: (showGrid) => set({ showGrid }),
  setZoomLevel: (zoomLevel) => set({ zoomLevel }),
  toggleMinimap: () => set((s) => ({ showMinimap: !s.showMinimap })),
  toggleLayers: () => set((s) => ({ showLayers: !s.showLayers })),
  toggleFullscreen: () => set((s) => ({ fullscreen: !s.fullscreen })),
  setPresence: (presence) => set({ presence }),
  setAlignmentGuides: (alignmentGuides) => set({ alignmentGuides }),

  setViewport: (viewport) => set({ viewport }),
  setElements: (elements) => set({ elements }),

  addElement: (element) => set((s) => ({ elements: [...s.elements, element] })),

  updateElement: (id, patch) =>
    set((s) => ({
      elements: s.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)),
    })),

  updateElements: (ids, patch) =>
    set((s) => ({
      elements: s.elements.map((el) => (ids.includes(el.id) ? { ...el, ...patch } : el)),
    })),

  removeElement: (id) => set((s) => ({ elements: s.elements.filter((el) => el.id !== id) })),

  removeElements: (ids) =>
    set((s) => ({
      elements: s.elements.filter((el) => !ids.includes(el.id)),
      selectedIds: s.selectedIds.filter((id) => !ids.includes(id)),
    })),

  setSelectedIds: (ids) => set({ selectedIds: ids }),
  select: (id, additive = false) =>
    set((s) => ({
      selectedIds: additive ? [...s.selectedIds, id] : [id],
    })),
  deselectAll: () => set({ selectedIds: [] }),

  toggleLock: (id) =>
    set((s) => ({
      elements: s.elements.map((el) => (el.id === id ? { ...el, locked: !el.locked } : el)),
    })),

  toggleLockSelected: () =>
    set((s) => {
      const locked = s.elements.some((el) => s.selectedIds.includes(el.id) && el.locked);
      return {
        elements: s.elements.map((el) =>
          s.selectedIds.includes(el.id) ? { ...el, locked: !locked } : el,
        ),
      };
    }),

  duplicateSelected: () =>
    set((s) => {
      const newElements = s.selectedIds.map((id) => {
        const orig = s.elements.find((el) => el.id === id);
        if (!orig) return null;
        return { ...orig, id: uuidv4(), x: orig.x + 24, y: orig.y + 24 };
      }).filter(Boolean);
      return {
        elements: [...s.elements, ...newElements],
        selectedIds: newElements.map((el) => el.id),
      };
    }),

  duplicateElement: (id) =>
    set((s) => {
      const orig = s.elements.find((el) => el.id === id);
      if (!orig) return s;
      const copy = { ...orig, id: uuidv4(), x: orig.x + 24, y: orig.y + 24 };
      return { elements: [...s.elements, copy], selectedIds: [copy.id] };
    }),

  groupSelected: () =>
    set((s) => {
      if (s.selectedIds.length < 2) return s;
      const groupId = uuidv4();
      return {
        elements: s.elements.map((el) =>
          s.selectedIds.includes(el.id) ? { ...el, groupId } : el,
        ),
        selectedIds: s.selectedIds,
      };
    }),

  ungroupSelected: () =>
    set((s) => ({
      elements: s.elements.map((el) =>
        s.selectedIds.includes(el.id) ? { ...el, groupId: null } : el,
      ),
    })),

  bringForward: () =>
    set((s) => {
      const ids = s.selectedIds;
      const nonSelected = s.elements.filter((el) => !ids.includes(el.id));
      const selected = s.elements.filter((el) => ids.includes(el.id));
      return { elements: [...nonSelected, ...selected] };
    }),

  sendBackward: () =>
    set((s) => {
      const ids = s.selectedIds;
      const selected = s.elements.filter((el) => ids.includes(el.id));
      const nonSelected = s.elements.filter((el) => !ids.includes(el.id));
      return { elements: [...selected, ...nonSelected] };
    }),

  pushHistory: () => set((s) => ({
    history: [...s.history.slice(0, s.historyIndex + 1), JSON.stringify(s.elements)].slice(-100),
    historyIndex: Math.min(s.historyIndex + 1, 99),
  })),

  undo: () => {
    const s = get();
    if (s.historyIndex <= 0) return;
    const idx = s.historyIndex - 1;
    set({
      elements: JSON.parse(s.history[idx] || '[]'),
      historyIndex: idx,
    });
  },

  redo: () => {
    const s = get();
    if (s.historyIndex >= s.history.length - 1) return;
    const idx = s.historyIndex + 1;
    set({
      elements: JSON.parse(s.history[idx] || '[]'),
      historyIndex: idx,
    });
  },

  copySelection: () => set((s) => ({ clipboard: s.selectedIds })),
  cutSelection: () =>
    set((s) => {
      const ids = s.selectedIds;
      return {
        clipboard: ids,
        elements: s.elements.filter((el) => !ids.includes(el.id)),
        selectedIds: [],
      };
    }),

  pasteClipboard: () =>
    set((s) => {
      const newEls = s.clipboard.map((id) => {
        const orig = s.elements.find((el) => el.id === id);
        if (!orig) return null;
        return { ...orig, id: uuidv4(), x: orig.x + 24, y: orig.y + 24 };
      }).filter(Boolean);
      return { elements: [...s.elements, ...newEls], selectedIds: newEls.map((el) => el.id) };
    }),

  importElements: (newElements) =>
    set((s) => {
      const withIds = newElements.map((el) => ({
        ...el,
        id: el.id || uuidv4(),
      }));
      return { elements: [...s.elements, ...withIds] };
    }),

  reset: () =>
    set({
      boardId: null,
      elements: [],
      selectedIds: [],
      tool: 'selection',
      viewport: { x: 0, y: 0, scale: 1 },
      history: [],
      historyIndex: -1,
      presence: [],
    }),
}));
