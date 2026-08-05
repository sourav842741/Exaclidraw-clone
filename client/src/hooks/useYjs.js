import { useEffect, useRef, useState } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';
import { WS_URL } from '../config.js';
import { useAuthStore } from '../stores/authStore.js';
import { useCanvasStore } from '../stores/canvasStore.js';

function hashColor(name) {
  const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#8b5cf6', '#ec4899', '#84cc16'];
  let h = 0;
  for (let i = 0; i < name.length; i += 1) h = name.charCodeAt(i) + ((h << 5) - h);
  return colors[Math.abs(h) % colors.length];
}

export function useYjs({ boardId, enabled = true }) {
  const [status, setStatus] = useState('disconnected');
  const [syncState, setSyncState] = useState({ synced: false });
  const providerRef = useRef(null);
  const ydocRef = useRef(null);
  const token = useAuthStore((s) => s.accessToken);
  const user = useAuthStore((s) => s.user);
  const setYdoc = useCanvasStore((s) => s.setYdoc);
  const setElements = useCanvasStore((s) => s.setElements);

  useEffect(() => {
    if (!enabled || !boardId || !token) return;

    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;
    setYdoc(ydoc);

    const provider = new WebsocketProvider(WS_URL, `board:${boardId}`, ydoc, {
      connect: true,
    });
    providerRef.current = provider;

    const yElements = ydoc.getArray('elements');
    const yViewport = ydoc.getMap('viewport');

    const observer = () => {
      setElements(yElements.toArray());
    };
    yElements.observe(observer);

    yViewport.observe(() => {
      const v = yViewport.toJSON();
      if (v && v.x !== undefined) {
        useCanvasStore.getState().setViewport(v);
      }
    });

    provider.on('status', (e) => setStatus(e.status));
    provider.on('sync', (isSynced) => {
      setSyncState({ synced: isSynced });
      if (isSynced) setElements(yElements.toArray());
    });

    // Awareness presence
    const awareness = provider.awareness;
    awareness.setLocalStateField('user', {
      name: user?.name || 'Anonymous',
      color: hashColor(user?.name || 'Anonymous'),
      avatar: user?.avatar,
      boardId,
    });

    return () => {
      provider.destroy();
      ydoc.destroy();
      setYdoc(null);
    };
  }, [boardId, enabled, token, user?.name, user?.avatar, setYdoc, setElements]);

  return {
    status,
    ydoc: ydocRef.current,
    provider: providerRef.current,
    syncState,
  };
}
