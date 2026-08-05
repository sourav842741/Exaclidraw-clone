import { useCanvasStore } from '../../stores/canvasStore.js';

const toolGroups = [
  {
    label: 'Select',
    tools: [
      { id: 'selection', icon: 'M4 4l7 17 2.5-7.5L21 11 4 4z', title: 'Select (V)' },
      { id: 'pan', icon: 'M8 13V5a1 1 0 0 1 2 0v8m0-4V4a1 1 0 0 1 2 0v6m0-4V6a1 1 0 0 1 2 0v5m4-2a5 5 0 0 1-1 3v5a5 5 0 0 1-5 5h-3a5 5 0 0 1-4-2l-2.5-3.5a2 2 0 0 1 3.1-2.5L10 15V5a2 2 0 1 1 4 0v1h1a2 2 0 1 1 0 4h-1', title: 'Pan (H)' },
    ],
  },
  {
    label: 'Draw',
    tools: [
      { id: 'pencil', icon: 'M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z', title: 'Pencil (P)' },
      { id: 'pen', icon: 'M12 19l7-7 3 3-7 7-3-3zM18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5zM2 2l7.586 7.586', title: 'Pen' },
      { id: 'marker', icon: 'M4 20h16M8 16L6 8l3-4h6l3 4-2 8-4 2-4-2z', title: 'Marker' },
      { id: 'highlighter', icon: 'M9 11l9-9 3 3-9 9M5 21l4-4', title: 'Highlighter' },
      { id: 'eraser', icon: 'M7 21a4 4 0 0 1-4-4V8a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4v9a4 4 0 0 1-4 4H7zM7 17V7h10v10', title: 'Eraser (E)' },
    ],
  },
  {
    label: 'Shapes',
    tools: [
      { id: 'rectangle', icon: 'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5z', title: 'Rectangle (R)' },
      { id: 'circle', icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z', title: 'Circle' },
      { id: 'ellipse', icon: 'M12 21c4.97 0 9-4.03 9-9s-4.03-9-9-9-9 4.03-9 9 4.03 9 9 9z', title: 'Ellipse (O)' },
      { id: 'diamond', icon: 'M12 2l10 10-10 10L2 12 12 2z', title: 'Diamond' },
      { id: 'triangle', icon: 'M12 2l10 20H2L12 2z', title: 'Triangle' },
    ],
  },
  {
    label: 'Lines',
    tools: [
      { id: 'arrow', icon: 'M5 19L19 5M19 5h-8m8 0v8', title: 'Arrow (A)' },
      { id: 'curveArrow', icon: 'M3 20c6 0 6-16 12-16M15 2l4 2-2 4', title: 'Curved Arrow' },
      { id: 'line', icon: 'M5 19L19 5', title: 'Line (L)' },
      { id: 'polyline', icon: 'M3 18h9l4-8h5', title: 'Polyline' },
    ],
  },
  {
    label: 'Content',
    tools: [
      { id: 'text', icon: 'M4 6h16M12 6v14m-4 0h8', title: 'Text (T)' },
      { id: 'sticky', icon: 'M4 4h13a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3H8l-4 4V4z', title: 'Sticky Note' },
      { id: 'image', icon: 'M3 5h18v14H3V5zm3 0l2 3m4-3v5m-3 3h14M6 17h8', title: 'Image' },
      { id: 'emoji', icon: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm-3-9h.01m6 0h.01M9 15a3.5 3.5 0 0 0 6 0', title: 'Emoji' },
      { id: 'frame', icon: 'M3 5h4M17 5h4M3 19h4m10 0h4M3 9v6m18-6v6', title: 'Frame' },
    ],
  },
];

export default function Toolbar() {
  const tool = useCanvasStore((s) => s.tool);
  const setTool = useCanvasStore((s) => s.setTool);
  const strokeColor = useCanvasStore((s) => s.strokeColor);
  const setStrokeColor = useCanvasStore((s) => s.setStrokeColor);
  const fillColor = useCanvasStore((s) => s.fillColor);
  const setFillColor = useCanvasStore((s) => s.setFillColor);
  const strokeWidth = useCanvasStore((s) => s.strokeWidth);
  const setStrokeWidth = useCanvasStore((s) => s.setStrokeWidth);
  const fontSize = useCanvasStore((s) => s.fontSize);
  const setFontSize = useCanvasStore((s) => s.setFontSize);

  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 glass-panel rounded-2xl px-2 py-2 flex items-center gap-1 shadow-lg">
      {toolGroups.map((group, gi) => (
        <div key={group.label} className={`flex items-center gap-0.5 ${gi > 0 ? 'border-l border-gray-200 dark:border-gray-700 pl-2 ml-1' : ''}`}>
          {group.tools.map((t) => (
            <button
              key={t.id}
              title={t.title}
              onClick={() => setTool(t.id)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                tool === t.id
                  ? 'bg-primary-500 text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={t.icon} /></svg>
            </button>
          ))}
        </div>
      ))}

      <div className="flex items-center gap-1 border-l border-gray-200 dark:border-gray-700 pl-2 ml-1">
        <label className="relative w-6 h-6 rounded cursor-pointer" title="Stroke color" style={{ background: strokeColor }}>
          <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
        <label className="relative w-6 h-6 rounded cursor-pointer border border-gray-300 dark:border-gray-600" title="Fill color" style={{ background: fillColor === 'transparent' ? 'url(data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFklEQVQYV2P8z8Dwn4EIwDiqEFXJABEYAgMAAv6HFGAAAAAASUVORK5CYII=)' : fillColor }}>
          <input type="color" value={fillColor === 'transparent' ? '#ffffff' : fillColor} onChange={(e) => setFillColor(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
          {fillColor !== 'transparent' && (
            <button className="absolute inset-0 flex items-center justify-center" onClick={(e) => { e.stopPropagation(); setFillColor('transparent'); }}>
              <span className="text-[10px] text-white bg-black/40 rounded px-0.5">∅</span>
            </button>
          )}
        </label>
        <div className="flex flex-col items-center px-1">
          <input type="range" min="1" max="20" value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="w-14 h-1" title="Stroke width" />
          <span className="text-[9px] text-gray-400">{strokeWidth}px</span>
        </div>
        <div className="flex flex-col items-center px-1">
          <input type="range" min="10" max="60" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="w-14 h-1" title="Font size" />
          <span className="text-[9px] text-gray-400">{fontSize}</span>
        </div>
      </div>
    </div>
  );
}
