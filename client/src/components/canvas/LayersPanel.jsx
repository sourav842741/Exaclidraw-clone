import { useCanvasStore } from '../../stores/canvasStore.js';

export default function LayersPanel() {
  const elements = useCanvasStore((s) => s.elements);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const setSelectedIds = useCanvasStore((s) => s.setSelectedIds);
  const bringForward = useCanvasStore((s) => s.bringForward);
  const sendBackward = useCanvasStore((s) => s.sendBackward);
  const toggleLock = useCanvasStore((s) => s.toggleLock);

  const sorted = [...elements].reverse();

  return (
    <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20 glass-panel rounded-xl w-52 shadow-lg p-2 max-h-[60vh] flex flex-col">
      <div className="flex items-center justify-between px-2 py-1.5">
        <span className="text-xs font-semibold text-gray-500">Layers</span>
        <div className="flex gap-1">
          <button onClick={sendBackward} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Send backward">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 10l9-6 9 6M3 16l9 6 9-6M3 13l9-6 9 6" /></svg>
          </button>
          <button onClick={bringForward} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800" title="Bring forward">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 14l9 6 9-6M3 8l9 6 9-6M3 11l9 6 9-6" /></svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto space-y-0.5">
        {sorted.map((el, idx) => (
          <div
            key={el.id}
            onClick={() => setSelectedIds([el.id])}
            className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer text-xs ${
              selectedIds.includes(el.id) ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
            }`}
          >
            <span className="w-3 h-3 rounded-sm border border-gray-400 flex-shrink-0" style={{ background: el.fill !== 'transparent' ? el.fill : el.stroke }} />
            <span className="flex-1 truncate capitalize">{el.text?.slice(0, 18) || el.type}</span>
            <button onClick={(e) => { e.stopPropagation(); toggleLock(el.id); }} className="opacity-50 hover:opacity-100">
              {el.locked ? '🔒' : '🔓'}
            </button>
          </div>
        ))}
        {sorted.length === 0 && <p className="text-xs text-gray-400 text-center py-4">Empty canvas</p>}
      </div>
    </div>
  );
}
