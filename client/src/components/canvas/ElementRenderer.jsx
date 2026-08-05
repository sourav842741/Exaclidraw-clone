import { Group, Rect, Ellipse, Line, Text, Image, RegularPolygon, Arrow } from 'react-konva';
import { useRef, useState, useEffect } from 'react';

function useImage(src) {
  const [img, setImg] = useState(null);
  useEffect(() => {
    if (!src) return;
    const image = new window.Image();
    image.onload = () => setImg(image);
    image.src = src;
  }, [src]);
  return img;
}

function TextShape({ el, selected, onDoubleClick }) {
  return (
    <Text
      x={el.x}
      y={el.y}
      width={el.width}
      height={el.height}
      text={el.text || ''}
      fontSize={el.fontSize || 18}
      fontFamily={el.fontFamily || 'Inter, sans-serif'}
      fontWeight={el.fontWeight || 400}
      fontStyle={el.fontWeight >= 600 ? 'bold' : 'normal'}
      fill={el.textColor || '#1f2937'}
      align={el.textAlign || 'left'}
      draggable={!el.locked}
      rotation={el.rotation || 0}
      opacity={el.opacity ?? 1}
      listening={!el.locked}
      onDblClick={onDoubleClick}
    />
  );
}

export default function ElementRenderer({ el, selected, selectable = true, onSelect, onDoubleClick }) {
  const img = useImage(el.src);

  if (el.type === 'image' && !img) return null;

  const common = {
    x: el.x,
    y: el.y,
    rotation: el.rotation || 0,
    opacity: el.opacity ?? 1,
    visible: el.visible !== false,
    draggable: selectable && !el.locked,
    onClick: (e) => {
      if (!selectable || el.locked) return;
      e.cancelBubble = true;
      onSelect?.(el.id, e.evt.shiftKey);
    },
    onTap: (e) => {
      if (!selectable || el.locked) return;
      e.cancelBubble = true;
      onSelect?.(el.id, e.evt?.shiftKey);
    },
    onDblClick: onDoubleClick ? () => onDoubleClick(el) : undefined,
  };

  const strokeWidth = el.locked ? el.strokeWidth || 2 : (el.strokeWidth || 2);

  switch (el.type) {
    case 'rectangle':
    case 'frame':
      return (
        <Rect
          {...common}
          width={el.width}
          height={el.height}
          fill={el.fill || 'transparent'}
          stroke={el.stroke}
          strokeWidth={strokeWidth}
          cornerRadius={el.borderRadius || 0}
          dash={el.type === 'frame' ? [10, 6] : undefined}
        >
          {el.text ? (
            <Text
              x={10}
              y={el.height / 2 - (el.fontSize || 16) / 2}
              width={el.width - 20}
              text={el.text}
              fontSize={el.fontSize || 16}
              fontFamily={el.fontFamily}
              fontStyle={el.fontWeight >= 600 ? 'bold' : 'normal'}
              fill={el.textColor || '#1f2937'}
              align={el.textAlign || 'center'}
            />
          ) : null}
        </Rect>
      );
    case 'circle':
      return <Ellipse {...common} radiusX={(el.width || 100) / 2} radiusY={(el.height || 100) / 2} fill={el.fill} stroke={el.stroke} strokeWidth={strokeWidth} />;
    case 'ellipse':
      return <Ellipse {...common} radiusX={(el.width || 160) / 2} radiusY={(el.height || 100) / 2} fill={el.fill} stroke={el.stroke} strokeWidth={strokeWidth} />;
    case 'diamond':
      return (
        <RegularPolygon {...common} sides={4} radius={Math.min(el.width, el.height) * 0.7} fill={el.fill} stroke={el.stroke} strokeWidth={strokeWidth} />
      );
    case 'triangle':
      return (
        <RegularPolygon {...common} sides={3} radius={Math.min(el.width, el.height) * 0.8} fill={el.fill} stroke={el.stroke} strokeWidth={strokeWidth} />
      );
    case 'line':
      return (
        <Line {...common} points={(el.points || [[el.x, el.y], [el.x + el.width, el.y + el.height]]).flat()} stroke={el.stroke} strokeWidth={strokeWidth} />
      );
    case 'arrow':
      return (
        <Arrow {...common} points={(el.points || [[el.x, el.y], [el.x + el.width, el.y]]).flat()} stroke={el.stroke} strokeWidth={strokeWidth} pointerLength={10} pointerWidth={10} fill={el.stroke} />
      );
    case 'curveArrow':
      return (
        <Arrow {...common} points={(el.points || [[el.x, el.y], [el.x + 60, el.y + 60], [el.x + 180, el.y]]).flat()} stroke={el.stroke} strokeWidth={strokeWidth} pointerLength={10} pointerWidth={10} fill={el.stroke} tension={0.5} />
      );
    case 'polyline':
      return <Line {...common} points={(el.points || [[el.x, el.y], [el.x + 60, el.y], [el.x + 60, el.y + 60]]).flat()} stroke={el.stroke} strokeWidth={strokeWidth} />;
    case 'pencil':
    case 'pen':
    case 'marker':
    case 'highlighter':
      return (
        <Line
          {...common}
          points={(el.points || [[el.x, el.y]]).flat()}
          stroke={el.type === 'highlighter' ? (el.stroke + '66') : el.stroke}
          strokeWidth={el.strokeWidth}
          lineCap="round"
          lineJoin="round"
          globalCompositeOperation={el.type === 'highlighter' ? 'multiply' : 'source-over'}
        />
      );
    case 'text':
      return <TextShape el={el} selected={selected} onDoubleClick={onDoubleClick} />;
    case 'sticky':
      return (
        <Group {...common}>
          <Rect width={el.width} height={el.height} fill={el.fill || '#fde047'} cornerRadius={6} shadowBlur={8} shadowOpacity={0.15} shadowOffsetY={3} stroke={el.stroke || '#f59e0b'} strokeWidth={1} />
          <Text x={10} y={10} width={el.width - 20} height={el.height - 20} text={el.text || ''} fontSize={el.fontSize || 15} fontFamily={el.fontFamily} fill="#374151" align={el.textAlign || 'left'} />
        </Group>
      );
    case 'emoji':
    case 'icon':
      return <TextShape el={el} selected={selected} onDoubleClick={onDoubleClick} />;
    case 'image':
      return <Image {...common} image={img} width={el.width} height={el.height} />;
    default:
      return null;
  }
}
