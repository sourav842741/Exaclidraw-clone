import { useEffect, useRef, useState } from 'react';
import { Stage, Layer, Rect, Circle, Line } from 'react-konva';

export default function Minimap({ stageRef, elements, viewport, onNavigate }) {
  const MINIMAP_WIDTH = 180;
  const MINIMAP_HEIGHT = 120;
  const stageInnerRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    if (!elements.length) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const el of elements) {
      const x = el.x || 0, y = el.y || 0;
      const w = el.width || 50, h = el.height || 30;
      minX = Math.min(minX, x); minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + w); maxY = Math.max(maxY, y + h);
    }
    if (isFinite(minX)) {
      const w = Math.max(maxX - minX, 400);
      const h = Math.max(maxY - minY, 300);
      setCanvasSize({ width: w, height: h });
    }
  }, [elements]);

  const scaleX = MINIMAP_WIDTH / Math.max(canvasSize.width, 1);
  const scaleY = MINIMAP_HEIGHT / Math.max(canvasSize.height, 1);
  const s = Math.min(scaleX, scaleY);

  const viewX = (-viewport.x / viewport.scale) * s;
  const viewY = (-viewport.y / viewport.scale) * s;
  const viewW = (window.innerWidth / viewport.scale) * s;
  const viewH = (window.innerHeight / viewport.scale) * s;

  return (
    <div className="absolute bottom-4 right-4 glass-panel rounded-lg p-2 select-none hidden md:block">
      <div className="text-[10px] text-gray-400 mb-1 px-1 flex items-center justify-between">
        <span>Minimap</span>
        <span>{Math.round(viewport.scale * 100)}%</span>
      </div>
      <Stage
        ref={stageInnerRef}
        width={MINIMAP_WIDTH}
        height={MINIMAP_HEIGHT}
        onClick={(e) => {
          const pos = e.target.getStage().getPointerPosition();
          const worldX = pos.x / s;
          const worldY = pos.y / s;
          onNavigate(-worldX * viewport.scale + window.innerWidth / 2, -worldY * viewport.scale + window.innerHeight / 2, viewport.scale);
        }}
      >
        <Layer>
          <Rect width={MINIMAP_WIDTH} height={MINIMAP_HEIGHT} fill="#f1f5f9" />
          {elements.slice(0, 500).map((el) => {
            const x = (el.x || 0) * s;
            const y = (el.y || 0) * s;
            const w = Math.max((el.width || 10) * s, 2);
            const h = Math.max((el.height || 10) * s, 2);
            return <Rect key={el.id} x={x} y={y} width={w} height={h} fill={el.fill || '#94a3b8'} opacity={0.8} cornerRadius={1} />;
          })}
        </Layer>
        <Layer>
          <Rect x={viewX} y={viewY} width={Math.min(viewW, MINIMAP_WIDTH)} height={Math.min(viewH, MINIMAP_HEIGHT)} stroke="#6366f1" strokeWidth={1.5} dash={[4, 2]} />
        </Layer>
      </Stage>
    </div>
  );
}
