import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { boardApi } from '../api/index.js';
import { useCanvasStore } from '../stores/canvasStore.js';
import { useCollaborationStore } from '../stores/collaborationStore.js';
import { useSocket } from '../hooks/useSocket.js';
import { useYjs } from '../hooks/useYjs.js';
import { useDebouncedCallback } from '../hooks/useDebounce.js';
import WhiteboardCanvas from '../components/canvas/WhiteboardCanvas.jsx';
import Toolbar from '../components/canvas/Toolbar.jsx';
import ZoomControls from '../components/canvas/ZoomControls.jsx';
import LayersPanel from '../components/canvas/LayersPanel.jsx';
import CollaborationPanel from '../components/canvas/CollaborationPanel.jsx';
import AIPanel from '../components/ai/AIPanel.jsx';
import ExportMenu from '../components/canvas/ExportMenu.jsx';
import Logo from '../components/common/Logo.jsx';
import Button from '../components/common/Button.jsx';

export default function BoardEditor() {
  const { id } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const [aiOpen, setAiOpen] = useState(false);
  const [saved, setSaved] = useState(true);
  const [saving, setSaving] = useState(false);
  const [boardName, setBoardName] = useState('');

  const elements = useCanvasStore((s) => s.elements);
  const viewport = useCanvasStore((s) => s.viewport);
  const setBoardId = useCanvasStore((s) => s.setBoardId);
  const reset = useCanvasStore((s) => s.reset);
  const setJoined = useCollaborationStore((s) => s.setRoomId);

  const { data: board, isLoading } = useQuery({
    queryKey: ['board', id],
    queryFn: () => boardApi.get(id),
  });

  useEffect(() => {
    if (board?.id) {
      setBoardId(board.id);
      setBoardName(board.name);
    }
    return () => {
      setBoardId(null);
      reset();
    };
  }, [board?.id, setBoardId, reset]);

  // Yjs CRDT
  const { status, syncState } = useYjs({ boardId: id, enabled: true });

  // Socket.IO join room
  useEffect(() => {
    if (!socket || !id) return;
    socket.emit('board:join', { boardId: id }, ({ ok }) => {
      if (ok) setJoined(id);
    });
    return () => {
      socket.emit('board:leave', { boardId: id });
    };
  }, [socket, id, setJoined]);

  // Debounced autosave to REST (fallback snapshot for versioning)
  const saveToServer = useDebouncedCallback(async (els, vp) => {
    if (!id) return;
    setSaving(true);
    try {
      await boardApi.saveElements(id, { elements: els, state: { viewport: vp } });
      setSaved(true);
    } catch (err) {
      toast.error('Autosave failed');
    } finally {
      setSaving(false);
    }
  }, 1500);

  useEffect(() => {
    if (id) {
      setSaved(false);
      saveToServer(elements, viewport);
    }
  }, [elements, viewport]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading board...</div>
      </div>
    );
  }

  const syncLabel = status === 'connected' ? 'Live' : status === 'connecting' ? 'Connecting...' : 'Offline';

  return (
    <div className="fixed inset-0 bg-white dark:bg-gray-950 overflow-hidden flex flex-col">
      {/* Top bar */}
      <div className="h-12 flex items-center justify-between px-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 z-30">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/boards')} className="btn-ghost !p-1.5">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7" /></svg>
          </button>
          <Logo size={24} />
          <input
            className="bg-transparent font-semibold text-sm outline-none w-48"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            onBlur={() => boardApi.update(id, { name: boardName }).catch(() => {})}
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400 flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : status === 'connecting' ? 'bg-amber-400' : 'bg-red-400'}`} />
            {syncLabel} {saving && '· saving'}
          </span>
          <Button size="sm" onClick={() => setAiOpen((v) => !v)}>
            <span className="text-sm">✨</span> AI
          </Button>
          <ExportMenu boardId={id} />
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 relative">
        <WhiteboardCanvas height="100%" />
        <Toolbar />
        <ZoomControls onNavigate={(v) => useCanvasStore.getState().setViewport(v)} />
        <LayersPanel />
        <CollaborationPanel />
        {aiOpen && <AIPanel boardId={id} onClose={() => setAiOpen(false)} />}
      </div>
    </div>
  );
}
