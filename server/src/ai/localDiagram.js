let uid = 0;
const nextId = () => `el_${Date.now().toString(36)}_${(uid += 1)}`;

const palette = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6'];

export function createLocalDiagram(prompt, type) {
  const words = prompt
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .slice(0, 6);

  const nodes = words.length ? words : ['Main'];
  const elements = [];
  let y = 80;
  const spacing = 220;

  if (type === 'mindmap') {
    elements.push(makeSticky(0, 40, 240, 80, prompt.split('\n')[0].slice(0, 40), '#f59e0b'));
    nodes.forEach((n, i) => {
      const color = palette[i % palette.length];
      elements.push(makeCircle(320 + (i % 2) * 260, 40 + Math.floor(i / 2) * 160, 140, 140, n, color));
    });
  } else if (type === 'architecture') {
    nodes.forEach((n, i) => {
      elements.push(makeRect(80, y, 220, 90, `${n}`, palette[i % palette.length]));
      if (i > 0) elements.push(makeArrow(300, y - 40, 80, y - 40, ''));
      y += spacing;
    });
  } else {
    nodes.forEach((n, i) => {
      const color = palette[i % palette.length];
      const isDecision = type === 'decisiontree' && i % 2 === 1;
      if (isDecision) {
        elements.push(makeDiamond(80, y, 200, 120, n, color));
      } else {
        elements.push(makeRect(80, y, 220, 90, n, color));
      }
      if (i > 0) elements.push(makeArrow(300, y - spacing + 45, 300, y + 45, ''));
      y += spacing;
    });
  }

  return {
    title: prompt.slice(0, 60),
    description: 'Generated locally (AI provider not configured).',
    elements,
    connections: [],
  };
}

function makeRect(x, y, w, h, text, fill) {
  return {
    id: nextId(), type: 'rectangle', x, y, width: w, height: h, rotation: 0,
    text, fill, stroke: '#475569', strokeWidth: 2, borderRadius: 10, fontSize: 16,
    fontWeight: 600, fontFamily: 'Inter, sans-serif', textAlign: 'center',
    locked: false, opacity: 1,
  };
}

function makeCircle(x, y, w, h, text, fill) {
  return {
    id: nextId(), type: 'ellipse', x, y, width: w, height: h, rotation: 0,
    text, fill, stroke: '#475569', strokeWidth: 2, fontSize: 14,
    fontWeight: 600, fontFamily: 'Inter, sans-serif', textAlign: 'center',
    locked: false, opacity: 1,
  };
}

function makeDiamond(x, y, w, h, text, fill) {
  return {
    id: nextId(), type: 'diamond', x, y, width: w, height: h, rotation: 0,
    text, fill, stroke: '#475569', strokeWidth: 2, fontSize: 14,
    fontWeight: 600, fontFamily: 'Inter, sans-serif', textAlign: 'center',
    locked: false, opacity: 1,
  };
}

function makeArrow(x1, y1, x2, y2, label) {
  return {
    id: nextId(), type: 'arrow', x: Math.min(x1, x2), y: Math.min(y1, y2),
    points: [[x1, y1], [x2, y2]], stroke: '#64748b', strokeWidth: 2,
    text: label || '', locked: false,
  };
}

function makeSticky(x, y, w, h, text, color) {
  return {
    id: nextId(), type: 'sticky', x, y, width: w, height: h, rotation: 0,
    text, fill: color, stroke: 'transparent', strokeWidth: 0, fontSize: 15,
    fontWeight: 500, fontFamily: 'Inter, sans-serif', textAlign: 'left',
    locked: false, opacity: 1,
  };
}
