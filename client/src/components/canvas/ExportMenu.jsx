import { useState, useRef } from 'react';
import { toast } from 'react-hot-toast';
import { API_URL } from '../../config.js';
import { useAuthStore } from '../../stores/authStore.js';
import Button from '../common/Button.jsx';

const formats = [
  { id: 'json', label: 'JSON', icon: '🃏', ext: 'json' },
  { id: 'svg', label: 'SVG', icon: '📐', ext: 'svg' },
  { id: 'png', label: 'PNG', icon: '🖼️', ext: 'png' },
  { id: 'pdf', label: 'PDF', icon: '📄', ext: 'pdf' },
  { id: 'markdown', label: 'Markdown', icon: '📝', ext: 'md' },
  { id: 'mermaid', label: 'Mermaid', icon: '🧬', ext: 'mmd' },
];

export default function ExportMenu({ boardId }) {
  const [open, setOpen] = useState(false);
  const token = useAuthStore((s) => s.accessToken);

  const exportBoard = async (format) => {
    try {
      const res = await fetch(`${API_URL}/boards/${boardId}/export/${format}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Export failed');
      const contentType = res.headers.get('Content-Type') || '';
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `board-${boardId}.${format === 'markdown' ? 'md' : format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${format.toUpperCase()}`);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="relative">
      <Button size="sm" variant="secondary" onClick={() => setOpen((v) => !v)}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
        Export
      </Button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 z-50 glass-panel rounded-xl p-2 w-44 animate-pop-in">
            {formats.map((f) => (
              <button
                key={f.id}
                onClick={() => { exportBoard(f.id); setOpen(false); }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <span>{f.icon}</span> {f.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
