import { boardService } from './board.service.js';

function escapeXml(str = '') {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function boundingBox(elements) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const el of elements || []) {
    const x1 = el.x || 0;
    const y1 = el.y || 0;
    const x2 = (el.x || 0) + (el.width || 100);
    const y2 = (el.y || 0) + (el.height || 60);
    minX = Math.min(minX, x1, x2);
    minY = Math.min(minY, y1, y2);
    maxX = Math.max(maxX, x1, x2);
    maxY = Math.max(maxY, y1, y2);
  }
  if (!isFinite(minX)) return { x: 0, y: 0, width: 800, height: 600 };
  return { x: minX, y: minY, width: maxX - minX || 800, height: maxY - minY || 600 };
}

function renderElementSVG(el) {
  const x = el.x || 0;
  const y = el.y || 0;
  const w = el.width || 100;
  const h = el.height || 60;
  const fill = el.fill || 'transparent';
  const stroke = el.stroke || '#475569';
  const sw = el.strokeWidth || 2;
  const label = el.text ? `<text x="${x + w / 2}" y="${y + h / 2}" text-anchor="middle" dominant-baseline="middle" font-family="${escapeXml(el.fontFamily || 'Inter, sans-serif')}" font-size="${el.fontSize || 16}" font-weight="${el.fontWeight || 500}" fill="${escapeXml(el.textColor || '#1f2937')}">${escapeXml(el.text)}</text>` : '';

  const g = (shape) => `<g transform="translate(${x},${y}) rotate(${el.rotation || 0})">${shape}${label.replace(`x="${x + w / 2}"`, `x="${w / 2}"`).replace(`y="${y + h / 2}"`, `y="${h / 2}"`)}</g>`;

  switch (el.type) {
    case 'rectangle':
    case 'frame':
      return g(`<rect width="${w}" height="${h}" fill="${escapeXml(fill)}" stroke="${escapeXml(stroke)}" stroke-width="${sw}" rx="${el.borderRadius || 0}"/>`);
    case 'ellipse':
      return g(`<ellipse cx="${w / 2}" cy="${h / 2}" rx="${w / 2}" ry="${h / 2}" fill="${escapeXml(fill)}" stroke="${escapeXml(stroke)}" stroke-width="${sw}"/>`);
    case 'diamond':
      return g(`<polygon points="${w / 2},0 ${w},${h / 2} ${w / 2},${h} 0,${h / 2}" fill="${escapeXml(fill)}" stroke="${escapeXml(stroke)}" stroke-width="${sw}"/>`);
    case 'triangle':
      return g(`<polygon points="${w / 2},0 ${w},${h} 0,${h}" fill="${escapeXml(fill)}" stroke="${escapeXml(stroke)}" stroke-width="${sw}"/>`);
    case 'line':
      return `<line x1="${x}" y1="${y}" x2="${(el.points?.[1]?.[0] ?? x + w)}" y2="${(el.points?.[1]?.[1] ?? y + h)}" stroke="${escapeXml(stroke)}" stroke-width="${sw}"/>`;
    case 'arrow': {
      const [x1, y1] = el.points?.[0] || [x, y];
      const [x2, y2] = el.points?.[1] || [x + w, y + h];
      return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${escapeXml(stroke)}" stroke-width="${sw}" marker-end="url(#arrowhead)"/>`;
    }
    case 'sticky':
      return `<g transform="translate(${x},${y})"><rect width="${w}" height="${h}" fill="${escapeXml(fill)}" rx="4"/><text x="${10}" y="${20}" font-family="${escapeXml(el.fontFamily || 'Inter, sans-serif')}" font-size="${el.fontSize || 15}" fill="#1f2937">${escapeXml(el.text || '')}</text></g>`;
    case 'text':
      return `<text x="${x}" y="${y + (el.fontSize || 20)}" font-family="${escapeXml(el.fontFamily || 'Inter, sans-serif')}" font-size="${el.fontSize || 20}" font-weight="${el.fontWeight || 500}" fill="${escapeXml(el.textColor || '#1f2937')}">${escapeXml(el.text || '')}</text>`;
    default:
      return '';
  }
}

export class ExportService {
  async exportSVG(boardId, userId) {
    const board = await boardService.authorize(boardId, userId, ['viewer', 'commenter', 'editor', 'owner']);
    const elements = board.elements || [];
    const box = boundingBox(elements);
    const defs = '<defs><marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto"><polygon points="0 0, 10 3.5, 0 7" fill="#475569"/></marker></defs>';
    const body = elements.map(renderElementSVG).join('\n');
    return {
      content: `<svg xmlns="http://www.w3.org/2000/svg" width="${box.width}" height="${box.height}" viewBox="${box.x} ${box.y} ${box.width} ${box.height}">${defs}${body}</svg>`,
      contentType: 'image/svg+xml',
      filename: `${board.name}.svg`,
    };
  }

  async exportJSON(boardId, userId) {
    const board = await boardService.authorize(boardId, userId, ['viewer', 'commenter', 'editor', 'owner']);
    return {
      content: JSON.stringify(
        {
          version: '1.0',
          app: 'vectorshare-ai',
          name: board.name,
          type: board.type,
          exportedAt: new Date().toISOString(),
          elements: board.elements || [],
          state: board.state,
        },
        null,
        2,
      ),
      contentType: 'application/json',
      filename: `${board.name}.json`,
    };
  }

  async exportMarkdown(boardId, userId) {
    const board = await boardService.authorize(boardId, userId, ['viewer', 'commenter', 'editor', 'owner']);
    const elements = board.elements || [];
    const md = [
      `# ${board.name}`,
      '',
      board.description ? `${board.description}` : '',
      '',
      '## Elements',
      '',
      elements
        .filter((e) => e.text)
        .map((e) => `- **${e.type}**: ${e.text.replace(/\n/g, ' ')}`)
        .join('\n'),
      '',
      '## Connections',
      '',
      elements
        .filter((e) => ['arrow', 'line'].includes(e.type) && e.text)
        .map((e) => `- ${e.text}`)
        .join('\n'),
      '',
    ].join('\n');
    return {
      content: md,
      contentType: 'text/markdown',
      filename: `${board.name}.md`,
    };
  }

  async exportMermaid(boardId, userId) {
    const board = await boardService.authorize(boardId, userId, ['viewer', 'commenter', 'editor', 'owner']);
    const elements = board.elements || [];
    const nodes = elements
      .filter((e) => e.text && ['rectangle', 'sticky', 'ellipse', 'diamond'].includes(e.type))
      .map((e, i) => `  N${i}["${e.text.replace(/"/g, "'").replace(/\n/g, ' ')}"]`)
      .join('\n');
    const edges = elements
      .filter((e) => e.type === 'arrow' && e.text)
      .map((e) => `  ${e.text}`)
      .join('\n');
    return {
      content: `flowchart TD\n${nodes}\n${edges}`,
      contentType: 'text/plain',
      filename: `${board.name}.mmd`,
    };
  }

  async exportPNG(boardId, userId, options = {}) {
    const board = await boardService.authorize(boardId, userId, ['viewer', 'commenter', 'editor', 'owner']);
    const elements = board.elements || [];
    const box = boundingBox(elements);
    const scale = options.scale || 2;

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${box.width * scale}" height="${box.height * scale}" viewBox="${box.x} ${box.y} ${box.width} ${box.height}">${(elements.map(renderElementSVG)).join('\n')}</svg>`;
    const b64 = Buffer.from(svg).toString('base64');
    const dataUrl = `data:image/svg+xml;base64,${b64}`;

    return {
      content: JSON.stringify({ dataUrl, width: box.width * scale, height: box.height * scale }),
      contentType: 'application/json',
      filename: `${board.name}.png.json`,
      isImage: true,
    };
  }

  async exportPDF(boardId, userId) {
    const markdown = await this.exportMarkdown(boardId, userId);
    const pdfText = [
      `VectorShare AI — ${markdown.filename}`,
      '',
      markdown.content,
    ].join('\n');
    return {
      content: pdfText,
      contentType: 'text/plain',
      filename: `${boardId}.pdf.txt`,
      note: 'PDF generation requires a rendering worker (see rabbitmq/export worker).',
    };
  }
}

export const exportService = new ExportService();
