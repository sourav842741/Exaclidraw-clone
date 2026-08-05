import { Stage, Layer, Group, Rect, Line, Text, Transformer, Ellipse, Arrow } from 'react-konva';
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Stage as KonvaStage } from 'konva';
import { useCanvasStore } from '../../stores/canvasStore.js';
import { useCollaborationStore } from '../../stores/collaborationStore.js';
import ElementRenderer from './ElementRenderer.jsx';
import Minimap from './Minimap.jsx';
import { createElement, getBounds, pointInElement, moveElement, snapToGrid, getSelectionBounds } from '../../utils/shapes.js';

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

export default function WhiteboardCanvas({ height = 'calc(100vh - 48px)' }) {
  const stageRef = useRef(null);
  const [stageSize, setStageSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [cursorPos, setCursorPos] = useState(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  const [marqueeRect, setMarqueeRect] = useState(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const [draftElement, setDraftElement] = useState(null);
  const [dragOffset, setDragOffset] = useState({});
  const [scale, setScale] = useState(1);
  const [x, setX] = useState(0);
  const [y, setY] = useState(0);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const elements = useCanvasStore((s) => s.elements);
  const setElements = useCanvasStore((s) => s.setElements);
  const selectedIds = useCanvasStore((s) => s.selectedIds);
  const setSelectedIds = useCanvasStore((s) => s.setSelectedIds);
  const tool = useCanvasStore((s) => s.tool);
  const setTool = useCanvasStore((s) => s.setTool);
  const strokeColor = useCanvasStore((s) => s.strokeColor);
  const strokeWidth = useCanvasStore((s) => s.strokeWidth);
  const fillColor = useCanvasStore((s) => s.fillColor);
  const fontSize = useCanvasStore((s) => s.fontSize);
  const fontFamily = useCanvasStore((s) => s.fontFamily);
  const snapToGridEnabled = useCanvasStore((s) => s.snapToGrid);
  const gridSize = useCanvasStore((s) => s.gridSize);
  const showGrid = useCanvasStore((s) => s.showGrid);
  const gridColor = useCanvasStore((s) => s.gridColor);
  const pushHistory = useCanvasStore((s) => s.pushHistory);
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const duplicateSelected = useCanvasStore((s) => s.duplicateSelected);
  const removeElements = useCanvasStore((s) => s.removeElements);
  const toggleLockSelected = useCanvasStore((s) => s.toggleLockSelected);
  const groupSelected = useCanvasStore((s) => s.groupSelected);
  const ungroupSelected = useCanvasStore((s) => s.ungroupSelected);
  const copySelection = useCanvasStore((s) => s.copySelection);
  const cutSelection = useCanvasStore((s) => s.cutSelection);
  const pasteClipboard = useCanvasStore((s) => s.pasteClipboard);
  const addElement = useCanvasStore((s) => s.addElement);
  const updateElement = useCanvasStore((s) => s.updateElement);

  const cursors = useCollaborationStore((s) => s.cursors);
  const socket = useCollaborationStore((s) => s.socket);
  const boardId = useCanvasStore((s) => s.boardId);
  const setViewport = useCanvasStore((s) => s.setViewport);

  const drawingTool = useMemo(
    () => ['pencil', 'pen', 'marker', 'highlighter', 'eraser'].includes(tool),
    [tool],
  );
  const shapeTool = useMemo(
    () => ['rectangle', 'circle', 'ellipse', 'diamond', 'triangle', 'line', 'arrow', 'curveArrow', 'polyline', 'sticky', 'frame'].includes(tool),
    [tool],
  );

  const getPointerPos = () => {
    const stage = stageRef.current;
    if (!stage) return { x: 0, y: 0 };
    const pos = stage.getPointerPosition();
    if (!pos) return { x: 0, y: 0 };
    return { x: (pos.x - x) / scale, y: (pos.y - y) / scale };
  };

  const sendCursor = useCallback((pos) => {
    if (!socket || !boardId) return;
    socket.emit('cursor:update', { boardId, x: pos.x, y: pos.y });
  }, [socket, boardId]);

  useEffect(() => {
    const onResize = () => setStageSize({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const onWheel = (e) => {
    e.evt.preventDefault();
    const stage = stageRef.current;
    const pointer = stage.getPointerPosition();
    const oldScale = scale;
    const delta = e.evt.deltaY > 0 ? 0.9 : 1.1;
    let newScale = oldScale * delta;
    newScale = Math.max(0.1, Math.min(5, newScale));
    const mousePointTo = {
      x: (pointer.x - x) / oldScale,
      y: (pointer.y - y) / oldScale,
    };
    const newX = pointer.x - mousePointTo.x * newScale;
    const newY = pointer.y - mousePointTo.y * newScale;
    setScale(newScale);
    setX(newX);
    setY(newY);
    setViewport({ x: newX, y: newY, scale: newScale });
  };

  const handleMouseDown = (e) => {
    const stage = stageRef.current;
    const isRight = e.evt.button === 2;
    if (isRight || tool === 'pan' || e.evt.altKey) {
      setIsPanning(true);
      lastPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
      return;
    }

    if (e.target === stage) {
      if (tool === 'selection') {
        setIsMultiSelecting(true);
        const pos = getPointerPos();
        setMarqueeRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
        setSelectedIds([]);
        return;
      }
      if (drawingTool || shapeTool || tool === 'text' || tool === 'emoji' || tool === 'icon') {
        const pos = getPointerPos();
        setIsDrawing(true);
        const snap = (v) => (snapToGridEnabled ? snapToGrid(v, gridSize) : v);
        const p = { x: snap(pos.x), y: snap(pos.y) };
        lastPosRef.current = p;

        if (drawingTool) {
          const el = createElement(tool, p.x, p.y, { stroke: strokeColor, strokeWidth: tool === 'highlighter' ? 14 : strokeWidth, points: [[p.x, p.y]], fill: 'transparent' });
          addElement(el);
          setDraftElement(el.id);
        } else if (tool === 'text') {
          const el = createElement('text', p.x, p.y, { text: '', fontSize, fontFamily });
          addElement(el);
          setDraftElement(el.id);
          setEditingTextId(el.id);
        } else if (tool === 'emoji' || tool === 'icon') {
          const el = createElement(tool, p.x, p.y, { fontSize: fontSize + 20 });
          addElement(el);
          setDraftElement(null);
          pushHistory();
        } else {
          const el = createElement(tool, p.x, p.y, { stroke: strokeColor, strokeWidth, fill: fillColor });
          addElement(el);
          setDraftElement(el.id);
        }
      }
    } else {
      // element click handled by ElementRenderer onSelect
    }
  };

  const handleMouseMove = (e) => {
    const pos = getPointerPos();
    sendCursor(pos);
    setCursorPos(pos);

    if (isPanning) {
      const dx = e.evt.clientX - lastPosRef.current.x;
      const dy = e.evt.clientY - lastPosRef.current.y;
      lastPosRef.current = { x: e.evt.clientX, y: e.evt.clientY };
      setX((v) => v + dx);
      setY((v) => v + dy);
      return;
    }

    if (isMultiSelecting && marqueeRect) {
      const snap = (v) => (snapToGridEnabled ? snapToGrid(v, gridSize) : v);
      const p = { x: snap(pos.x), y: snap(pos.y) };
      setMarqueeRect((m) => ({
        x: Math.min(m.x, p.x),
        y: Math.min(m.y, p.y),
        w: Math.abs(m.x - p.x),
        h: Math.abs(m.y - p.y),
      }));
      return;
    }

    if (isDrawing && draftElement) {
      const el = elements.find((i) => i.id === draftElement);
      if (!el) return;
      const snap = (v) => (snapToGridEnabled ? snapToGrid(v, gridSize) : v);
      const p = { x: snap(pos.x), y: snap(pos.y) };

      if (drawingTool) {
        updateElement(draftElement, { points: [...(el.points || []), [p.x, p.y]] });
        return;
      }

      let patch = {};
      const start = lastPosRef.current;
      switch (tool) {
        case 'line':
        case 'arrow':
        case 'curveArrow':
        case 'polyline':
          patch = { points: [[start.x, start.y], [p.x, p.y]] };
          break;
        case 'rectangle':
        case 'frame':
        case 'sticky':
          patch = {
            x: Math.min(start.x, p.x),
            y: Math.min(start.y, p.y),
            width: Math.abs(p.x - start.x),
            height: Math.abs(p.y - start.y),
          };
          break;
        case 'circle':
        case 'ellipse':
          patch = {
            x: Math.min(start.x, p.x),
            y: Math.min(start.y, p.y),
            width: Math.abs(p.x - start.x),
            height: Math.abs(p.y - start.y),
          };
          break;
        case 'diamond':
        case 'triangle':
          patch = {
            x: Math.min(start.x, p.x),
            y: Math.min(start.y, p.y),
            width: Math.abs(p.x - start.x),
            height: Math.abs(p.y - start.y),
          };
          break;
        default:
          break;
      }
      updateElement(draftElement, patch);
    }
  };

  const handleMouseUp = () => {
    if (isMultiSelecting && marqueeRect) {
      const hits = elements.filter((el) => {
        const b = getBounds(el);
        return b.x + b.width >= marqueeRect.x && b.x <= marqueeRect.x + marqueeRect.w &&
          b.y + b.height >= marqueeRect.y && b.y <= marqueeRect.y + marqueeRect.h;
      });
      setSelectedIds(hits.map((el) => el.id));
      setMarqueeRect(null);
    }
    setIsMultiSelecting(false);
    setIsPanning(false);
    setIsDrawing(false);
    if (draftElement && !editingTextId) pushHistory();
    setDraftElement(null);
  };

  const handleStageDragEnd = (e) => {
    pushHistory();
  };

  const handleElementDrag = (e) => {
    const id = e.target.id();
    const el = elements.find((i) => i.id === id);
    if (!el) return;
    const dx = e.target.x() - el.x;
    const dy = e.target.y() - el.y;
    updateElement(id, { x: el.x + dx, y: el.y + dy });
  };

  const handleElementDragEnd = () => {
    pushHistory();
    // re-apply snap
  };

  const commitText = (id, text) => {
    updateElement(id, { text });
    setEditingTextId(null);
    setDraftElement(null);
    pushHistory();
  };

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
      const key = e.key.toLowerCase();
      if (e.ctrlKey && key === 'z') { e.preventDefault(); undo(); }
      else if (e.ctrlKey && key === 'y') { e.preventDefault(); redo(); }
      else if (e.ctrlKey && key === 'd') { e.preventDefault(); duplicateSelected(); pushHistory(); }
      else if (e.ctrlKey && key === 'c') { e.preventDefault(); copySelection(); }
      else if (e.ctrlKey && key === 'x') { e.preventDefault(); cutSelection(); pushHistory(); }
      else if (e.ctrlKey && key === 'v') { e.preventDefault(); pasteClipboard(); pushHistory(); }
      else if (key === 'delete' || key === 'backspace') { removeElements(selectedIds); pushHistory(); }
      else if (key === 'v') setTool('selection');
      else if (key === 'h') setTool('pan');
      else if (key === 'r') setTool('rectangle');
      else if (key === 'o') setTool('ellipse');
      else if (key === 'a') setTool('arrow');
      else if (key === 'l') setTool('line');
      else if (key === 't') setTool('text');
      else if (key === 'p') setTool('pencil');
      else if (key === 'e') setTool('eraser');
      else if (key === 'g' && e.shiftKey) { e.preventDefault(); groupSelected(); }
      else if (key === 'u' && e.shiftKey) { e.preventDefault(); ungroupSelected(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedIds, undo, redo, duplicateSelected, copySelection, cutSelection, pasteClipboard, removeElements, pushHistory, setTool, groupSelected, ungroupSelected]);

  // Map tool 'eraser' to removal on click
  useEffect(() => {
    if (tool !== 'eraser') return;
    const onDown = (e) => {
      if (e.target !== stageRef.current) {
        const id = e.target.id();
        if (id) { removeElements([id]); pushHistory(); }
      }
    };
    const stage = stageRef.current;
    stage?.on('mousedown', onDown);
    return () => stage?.off('mousedown', onDown);
  }, [tool, removeElements, pushHistory]);

  const renderCursorLayer = () => (
    <Layer listening={false}>
      {Object.entries(cursors).map(([socketId, cursor]) => (
        <Group key={socketId} x={cursor.x} y={cursor.y}>
          <Rect width={10} height={10} fill={cursor.color} cornerRadius={2} />
          <Text x={6} y={10} text={cursor.name || ''} fontSize={12} fill={cursor.color} fontStyle="bold" />
        </Group>
      ))}
    </Layer>
  );

  const renderGrid = () => {
    if (!showGrid) return null;
    const lines = [];
    const step = gridSize * scale;
    if (step < 10) return null;
    const offsetX = x % step;
    const offsetY = y % step;
    const countX = Math.ceil(stageSize.width / step) + 1;
    const countY = Math.ceil(stageSize.height / step) + 1;
    for (let i = 0; i < countX; i += 1) {
      lines.push(<Line key={`v${i}`} points={[offsetX + i * step, 0, offsetX + i * step, stageSize.height]} stroke={gridColor} strokeWidth={0.5} />);
    }
    for (let i = 0; i < countY; i += 1) {
      lines.push(<Line key={`h${i}`} points={[0, offsetY + i * step, stageSize.width, offsetY + i * step]} stroke={gridColor} strokeWidth={0.5} />);
    }
    return <Layer listening={false}>{lines}</Layer>;
  };

  const selBounds = getSelectionBounds(elements, selectedIds);

  return (
    <div className="relative w-full" style={{ height }}>
      <Stage
        ref={stageRef}
        width={stageSize.width}
        height={stageSize.height}
        scaleX={scale}
        scaleY={scale}
        x={x}
        y={y}
        onWheel={onWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => { setCursorPos(null); if (socket && boardId) socket.emit('cursor:clear', { boardId }); }}
        style={{ cursor: tool === 'pan' ? 'grab' : tool === 'selection' ? 'default' : 'crosshair' }}
      >
        {renderGrid()}
        <Layer>
          {elements.map((el) => (
            <ElementRenderer
              key={el.id}
              el={el}
              selected={selectedIds.includes(el.id)}
              selectable={tool === 'selection'}
              onSelect={(id, additive) => {
                if (!additive) setSelectedIds([id]);
                else setSelectedIds((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
                if (socket && boardId) socket.emit('selection:update', { boardId, elementIds: [id] });
              }}
              onDoubleClick={(el) => {
                if (['text', 'sticky', 'emoji', 'icon'].includes(el.type)) {
                  setEditingTextId(el.id);
                }
              }}
            />
          ))}
          {marqueeRect && (
            <Rect x={marqueeRect.x} y={marqueeRect.y} width={marqueeRect.w} height={marqueeRect.h} fill="rgba(99,102,241,0.08)" stroke="#6366f1" strokeWidth={1} />
          )}
        </Layer>
        {selBounds && selectedIds.length > 0 && tool === 'selection' && (
          <Transformer
            nodes={[stageRef.current.findOne(`#${selectedIds[0]}`)].filter(Boolean)}
            rotateEnabled
            borderStroke="#6366f1"
            anchorStroke="#6366f1"
            anchorFill="#fff"
            onTransformEnd={() => pushHistory()}
          />
        )}
        {renderCursorLayer()}
      </Stage>

      {/* Editing overlay */}
      {editingTextId && (
        <textarea
          className="absolute z-10 bg-transparent outline-none resize-none"
          style={{
            left: (elements.find((el) => el.id === editingTextId)?.x || 0) * scale + x,
            top: (elements.find((el) => el.id === editingTextId)?.y || 0) * scale + y,
            width: (elements.find((el) => el.id === editingTextId)?.width || 200) * scale,
            minHeight: 60,
            fontSize: (elements.find((el) => el.id === editingTextId)?.fontSize || 18) * scale,
            color: '#374151',
          }}
          autoFocus
          defaultValue={elements.find((el) => el.id === editingTextId)?.text || ''}
          onBlur={(e) => commitText(editingTextId, e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.target.blur(); }
            if (e.key === 'Escape') { setEditingTextId(null); }
          }}
        />
      )}

      <Minimap
        stageRef={stageRef}
        elements={elements}
        viewport={{ x, y, scale }}
        onNavigate={(nx, ny, nscale) => {
          setX(nx); setY(ny); setScale(nscale);
          setViewport({ x: nx, y: ny, scale: nscale });
        }}
      />
    </div>
  );
}
