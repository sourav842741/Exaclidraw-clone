import { useCanvasStore } from '../../stores/canvasStore.js';
import { useCollaborationStore } from '../../stores/collaborationStore.js';
import { useEffect, useState } from 'react';
import { boardApi } from '../../api/index.js';
import { toast } from 'react-hot-toast';

export default function CollaborationPanel() {
  const socket = useCollaborationStore((s) => s.socket);
  const boardId = useCanvasStore((s) => s.boardId);
  const presence = useCollaborationStore((s) => s.presence);
  const setPresence = useCollaborationStore((s) => s.setPresence);
  const cursors = useCollaborationStore((s) => s.cursors);
  const setCursor = useCollaborationStore((s) => s.setCursor);
  const removeCursor = useCollaborationStore((s) => s.removeCursor);
  const chatMessages = useCollaborationStore((s) => s.chatMessages);
  const addChatMessage = useCollaborationStore((s) => s.addChatMessage);
  const [tab, setTab] = useState('chat'); // chat | presence | comments
  const [text, setText] = useState('');
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');

  useEffect(() => {
    if (!socket) return;
    socket.on('presence:list', setPresence);
    socket.on('presence:join', (u) => setPresence((p) => [...p, u.user]));
    socket.on('presence:leave', (u) => setPresence((p) => p.filter((x) => x.socketId !== u.socketId)));
    socket.on('cursor:move', ({ socketId, x, y, user }) => setCursor(socketId, { x, y, name: user?.name, color: user?.color }));
    socket.on('cursor:left', ({ socketId }) => removeCursor(socketId));
    socket.on('chat:message', addChatMessage);
    socket.on('comment:added', (c) => setComments((prev) => [...prev, c]));

    return () => {
      socket.off('presence:list');
      socket.off('presence:join');
      socket.off('presence:leave');
      socket.off('cursor:move');
      socket.off('cursor:left');
      socket.off('chat:message');
      socket.off('comment:added');
    };
  }, [socket, setPresence, setCursor, removeCursor, addChatMessage]);

  useEffect(() => {
    if (boardId) {
      boardApi.comments(boardId).then(({ comments }) => setComments(comments)).catch(() => {});
    }
  }, [boardId]);

  const sendChat = (e) => {
    e.preventDefault();
    if (!text.trim() || !socket) return;
    socket.emit('chat:message', { boardId, text });
    setText('');
  };

  const addComment = (e) => {
    e.preventDefault();
    if (!commentText.trim() || !socket) return;
    socket.emit('comment:add', { boardId, body: commentText, x: 0, y: 0 }, ({ ok, comment }) => {
      if (ok) setCommentText('');
      else toast.error('Failed to add comment');
    });
  };

  return (
    <div className="absolute top-4 right-4 z-20 glass-panel rounded-2xl w-72 shadow-lg flex flex-col max-h-[70vh]">
      <div className="flex border-b border-gray-200 dark:border-gray-800">
        {[
          { id: 'chat', label: `Chat (${chatMessages.length})` },
          { id: 'presence', label: `People (${presence.length})` },
          { id: 'comments', label: `Comments (${comments.length})` },
        ].map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex-1 px-3 py-2.5 text-xs font-medium transition-colors ${
              tab === t.id ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-500' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto min-h-0 p-3" style={{ maxHeight: '45vh' }}>
        {tab === 'chat' && (
          <>
            <div className="space-y-3">
              {chatMessages.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No messages yet. Say hi!</p>}
              {chatMessages.map((m) => (
                <div key={m.id} className="flex items-start gap-2">
                  {m.user?.avatar ? (
                    <img src={m.user.avatar} alt="" className="w-6 h-6 rounded-full" />
                  ) : (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: m.user?.color || '#6366f1' }}>
                      {m.user?.name?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{m.user?.name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 break-words">{m.text}</p>
                  </div>
                </div>
              ))}
            </div>
            <form onSubmit={sendChat} className="flex gap-2 mt-3">
              <input className="input !py-1.5 text-sm" placeholder="Type a message..." value={text} onChange={(e) => setText(e.target.value)} />
              <button type="submit" className="btn-primary !px-3 !py-1.5">Send</button>
            </form>
          </>
        )}

        {tab === 'presence' && (
          <div className="space-y-2">
            {presence.map((u, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                {u.avatar ? <img src={u.avatar} className="w-7 h-7 rounded-full" alt="" /> : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: u.color || '#6366f1' }}>{u.name?.[0]?.toUpperCase()}</div>
                )}
                <span className="text-sm">{u.name}</span>
              </div>
            ))}
            {presence.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Only you here</p>}
          </div>
        )}

        {tab === 'comments' && (
          <>
            <div className="space-y-3">
              {comments.length === 0 && <p className="text-xs text-gray-400 text-center py-6">No comments</p>}
              {comments.map((c) => (
                <div key={c._id} className={`p-2 rounded-lg border ${c.resolved ? 'opacity-50 border-green-300 dark:border-green-700' : 'border-gray-200 dark:border-gray-700'}`}>
                  <p className="text-sm">{c.body}</p>
                  <p className="text-[10px] text-gray-400 mt-1">{c.author?.name} · {new Date(c.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
            <form onSubmit={addComment} className="flex flex-col gap-2 mt-3">
              <textarea className="input text-sm" rows={2} placeholder="Add a comment..." value={commentText} onChange={(e) => setCommentText(e.target.value)} />
              <button type="submit" className="btn-primary !py-1.5 text-sm">Add Comment</button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
