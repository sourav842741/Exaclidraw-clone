import { useCanvasStore } from '../../stores/canvasStore.js';

export default function ZoomControls({ onNavigate }) {
  const viewport = useCanvasStore((s) => s.viewport);
  const setViewport = useCanvasStore((s) => s.setViewport);

  const zoom = (factor) => {
    const newScale = Math.max(0.1, Math.min(5, viewport.scale * factor));
    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;
    const newX = cx - ((cx - viewport.x) / viewport.scale) * newScale;
    const newY = cy - ((cy - viewport.y) / viewport.scale) * newScale;
    const v = { x: newX, y: newY, scale: newScale };
    setViewport(v);
    onNavigate?.(v);
  };

  const reset = () => {
    const v = { x: 0, y: 0, scale: 1 };
    setViewport(v);
    onNavigate?.(v);
  };

  const fit = () => {
    const v = { x: 0, y: 0, scale: 1 };
    setViewport(v);
    onNavigate?.(v);
  };

  return (
    <div className="absolute bottom-4 left-4 z-20 glass-panel rounded-xl flex items-center gap-1 p-1">
      <button onClick={() => zoom(1 / 1.2)} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300" title="Zoom out">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14" /></svg>
      </button>
      <button onClick={() => zoom(1.2)} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300" title="Zoom in">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg>
      </button>
      <button onClick={reset} className="px-2 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-medium text-gray-600 dark:text-gray-300" title="Reset">
        {Math.round(viewport.scale * 100)}%
      </button>
      <button onClick={fit} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300" title="Fit to screen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" /></svg>
      </button>
      <button onClick={() => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen()} className="w-8 h-8 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300" title="Fullscreen">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 9V4h5m6 0h5v5M20 15v5h-5m-6 0H4v-5" /></svg>
      </button>
    </div>
  );
}
