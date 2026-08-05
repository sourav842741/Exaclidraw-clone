import { v4 as uuidv4 } from 'uuid';

export const DEFAULT_ELEMENT = {
  id: null,
  type: 'rectangle',
  x: 0,
  y: 0,
  width: 200,
  height: 120,
  rotation: 0,
  stroke: '#1e293b',
  strokeWidth: 2,
  fill: 'transparent',
  opacity: 1,
  locked: false,
  groupId: null,
  text: '',
  fontSize: 16,
  fontFamily: 'Inter, sans-serif',
  fontWeight: 400,
  textAlign: 'center',
  borderRadius: 8,
};

export function createElement(type, x, y, options = {}) {
  const base = { ...DEFAULT_ELEMENT, id: uuidv4(), x, y, ...options };
  switch (type) {
    case 'rectangle':
    case 'frame':
      return { ...base, type, width: options.width || 200, height: options.height || 120, borderRadius: options.borderRadius ?? 8 };
    case 'circle':
      return { ...base, type: 'circle', width: options.width || 120, height: options.height || 120 };
    case 'ellipse':
      return { ...base, type: 'ellipse', width: options.width || 160, height: options.height || 100 };
    case 'diamond':
      return { ...base, type: 'diamond', width: options.width || 180, height: options.height || 120 };
    case 'triangle':
      return { ...base, type: 'triangle', width: options.width || 160, height: options.height || 140 };
    case 'line':
      return { ...base, type: 'line', points: options.points || [[x, y], [x + 150, y + 150]], text: '' };
    case 'arrow':
      return { ...base, type: 'arrow', points: options.points || [[x, y], [x + 180, y]], text: '' };
    case 'curveArrow':
      return { ...base, type: 'curveArrow', points: options.points || [[x, y], [x + 60, y + 60], [x + 180, y]], text: '' };
    case 'polyline':
      return { ...base, type: 'polyline', points: options.points || [[x, y], [x + 60, y], [x + 60, y + 60]], text: '' };
    case 'text':
      return { ...base, type: 'text', width: options.width || 240, height: options.height || 40, text: options.text || 'Type here...', fontSize: options.fontSize || 20, stroke: 'transparent', fill: 'transparent' };
    case 'sticky':
      return { ...base, type: 'sticky', width: options.width || 220, height: options.height || 160, fill: options.fill || '#fde047', stroke: 'transparent', text: options.text || '', textAlign: 'left', fontSize: 15 };
    case 'image':
      return { ...base, type: 'image', width: options.width || 200, height: options.height || 200, src: options.src || '' };
    case 'emoji':
      return { ...base, type: 'emoji', width: options.width || 48, height: options.height || 48, text: options.text || '😊', fontSize: 40, fill: 'transparent', stroke: 'transparent' };
    case 'icon':
      return { ...base, type: 'icon', width: options.width || 48, height: options.height || 48, text: options.text || '✦', fontSize: 36, fill: 'transparent', stroke: 'transparent' };
    case 'pencil':
    case 'pen':
    case 'marker':
    case 'highlighter':
      return { ...base, type, points: options.points || [[x, y]], strokeWidth: type === 'highlighter' ? 12 : type === 'marker' ? 6 : 3, fill: 'transparent' };
    default:
      return base;
  }
}

export function getBounds(el) {
  if (el.type === 'text' || el.type === 'emoji' || el.type === 'icon') {
    return { x: el.x, y: el.y, width: el.width || 200, height: el.height || 40 };
  }
  if (el.points) {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const [px, py] of el.points || []) {
      minX = Math.min(minX, px); maxX = Math.max(maxX, px);
      minY = Math.min(minY, py); maxY = Math.max(maxY, py);
    }
    if (!isFinite(minX)) return { x: el.x, y: el.y, width: 100, height: 100 };
    return { x: minX, y: minY, width: maxX - minX || 1, height: maxY - minY || 1 };
  }
  return { x: el.x, y: el.y, width: el.width || 100, height: el.height || 60 };
}

export function getCenter(el) {
  const b = getBounds(el);
  return { x: b.x + b.width / 2, y: b.y + b.height / 2 };
}

export function pointInElement(el, px, py) {
  const b = getBounds(el);
  return px >= b.x && px <= b.x + b.width && py >= b.y && py <= b.y + b.height;
}

export function moveElement(el, dx, dy) {
  if (el.points) {
    return { ...el, points: el.points.map(([px, py]) => [px + dx, py + dy]) };
  }
  return { ...el, x: el.x + dx, y: el.y + dy };
}

export function resizeElement(el, newWidth, newHeight, dir) {
  const b = getBounds(el);
  let { x, y } = el;
  if (dir.includes('w')) x = b.x + (b.width - newWidth);
  if (dir.includes('n')) y = b.y + (b.height - newHeight);
  return { ...el, x, y, width: Math.max(newWidth, 10), height: Math.max(newHeight, 10) };
}

export function snapToGrid(v, gridSize = 20) {
  return Math.round(v / gridSize) * gridSize;
}

export function flattenGroups(elements) {
  return elements;
}

export function getSelectionBounds(elements, selectedIds) {
  const selected = elements.filter((el) => selectedIds.includes(el.id));
  if (selected.length === 0) return null;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const el of selected) {
    const b = getBounds(el);
    minX = Math.min(minX, b.x); minY = Math.min(minY, b.y);
    maxX = Math.max(maxX, b.x + b.width); maxY = Math.max(maxY, b.y + b.height);
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

export function elementsToYjs(yElements, elements) {
  // Yjs documents are observed directly on the client; this helper is kept for symmetry
  return elements;
}
