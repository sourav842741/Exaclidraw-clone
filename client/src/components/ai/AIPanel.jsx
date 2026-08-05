import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { aiApi } from '../../api/index.js';
import { useCanvasStore } from '../../stores/canvasStore.js';
import Button from '../common/Button.jsx';
import Spinner from '../common/Spinner.jsx';

const tabs = [
  { id: 'diagram', label: 'Diagram', icon: '📐', desc: 'Describe any diagram and generate it' },
  { id: 'mindmap', label: 'Mind Map', icon: '🧠', desc: 'Turn a topic into a structured mind map' },
  { id: 'mermaid', label: 'Mermaid', icon: '🧬', desc: 'Convert mermaid code into editable diagram' },
  { id: 'code', label: 'Code → Arch', icon: '💻', desc: 'Paste code, get an architecture diagram' },
  { id: 'meeting', label: 'Meeting AI', icon: '📝', desc: 'Summarize meetings into tasks & sticky notes' },
  { id: 'brainstorm', label: 'Brainstorm', icon: '💡', desc: 'Generate creative ideas as sticky notes' },
  { id: 'voice', label: 'Voice', icon: '🎤', desc: 'Speak and convert to a diagram' },
];

export default function AIPanel({ boardId, onClose }) {
  const [tab, setTab] = useState('diagram');
  const [loading, setLoading] = useState(false);
  const [input, setInput] = useState('');
  const [diagramType, setDiagramType] = useState('flowchart');
  const importElements = useCanvasStore((s) => s.importElements);
  const pushHistory = useCanvasStore((s) => s.pushHistory);

  const run = async (fn) => {
    setLoading(true);
    try {
      const result = await fn();
      return result;
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI request failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    let result = null;

    switch (tab) {
      case 'diagram':
        result = await run(() => aiApi.diagram({ prompt: input, type: diagramType }));
        if (result?.result?.elements) {
          importElements(result.result.elements);
          pushHistory();
          toast.success('Diagram generated');
        }
        break;
      case 'mindmap':
        result = await run(() => aiApi.mindmap({ topic: input }));
        if (result?.result?.elements) {
          importElements(result.result.elements);
          pushHistory();
          toast.success('Mind map generated');
        }
        break;
      case 'mermaid':
        result = await run(() => aiApi.mermaid({ mermaid: input }));
        if (result?.result?.mermaid) {
          toast.success('Mermaid parsed');
        }
        break;
      case 'code':
        result = await run(() => aiApi.codeToArch({ code: input, language: 'auto' }));
        if (result?.result?.components) {
          importElements(componentsToElements(result.result));
          pushHistory();
          toast.success('Architecture generated');
        }
        break;
      case 'meeting':
        result = await run(() => aiApi.meeting({ transcript: input }));
        if (result?.result) {
          importElements(meetingToStickies(result.result));
          pushHistory();
          toast.success('Meeting summary added as sticky notes');
        }
        break;
      case 'brainstorm':
        result = await run(() => aiApi.brainstorm({ topic: input }));
        if (result?.result?.ideas) {
          importElements(ideasToStickies(result.result.ideas));
          pushHistory();
          toast.success('Ideas generated');
        }
        break;
      case 'voice':
        result = await run(() => aiApi.voice({ text: input }));
        if (result?.result?.elements) {
          importElements(result.result.elements);
          pushHistory();
          toast.success('Voice diagram generated');
        }
        break;
      default:
        break;
    }
    if (result && !['mermaid', 'meeting', 'brainstorm'].includes(tab)) setInput('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="absolute right-4 top-16 bottom-4 z-30 glass-panel rounded-2xl w-96 shadow-xl flex flex-col overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2">
          <span className="text-lg">✨</span>
          <h3 className="font-semibold">AI Assistant</h3>
        </div>
        <button onClick={onClose} className="btn-ghost !p-1.5"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg></button>
      </div>

      <div className="flex gap-1.5 px-3 py-2.5 overflow-x-auto border-b border-gray-200 dark:border-gray-800">
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setInput(''); }}
            className={`flex flex-col items-center gap-0.5 min-w-[64px] p-2 rounded-lg transition-colors ${
              tab === t.id ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-700' : 'hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <span className="text-xl">{t.icon}</span>
            <span className="text-[10px] font-medium">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{tabs.find((t) => t.id === tab)?.desc}</p>

        {tab === 'diagram' && (
          <div className="mb-4">
            <label className="label">Diagram type</label>
            <select className="input" value={diagramType} onChange={(e) => setDiagramType(e.target.value)}>
              {['flowchart', 'architecture', 'mindmap', 'network', 'sequence', 'er', 'uml', 'organization'].map((t) => <option key={t}>{t}</option>)}
            </select>
          </div>
        )}

        {tab === 'voice' && (
          <div className="mb-4">
            <label className="label">Voice input (type or use browser speech)</label>
            <Button
              type="button"
              variant="secondary"
              className="w-full mb-2"
              onClick={() => {
                const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
                if (!SR) { toast.error('Speech recognition not supported'); return; }
                const rec = new SR();
                rec.lang = 'en-US';
                rec.onresult = (e) => setInput((p) => p + e.results[0][0].transcript);
                rec.start();
              }}
            >
              🎤 Start Speaking
            </Button>
          </div>
        )}

        <form onSubmit={handleGenerate} className="flex flex-col gap-3">
          <textarea
            className="input min-h-[120px]"
            placeholder={placeholderFor(tab)}
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button type="submit" disabled={loading}>
            {loading ? <Spinner size={18} /> : <><span>✨</span> Generate</>}
          </Button>
        </form>
      </div>
    </motion.div>
  );
}

function placeholderFor(tab) {
  switch (tab) {
    case 'diagram': return 'e.g. Design Netflix architecture with microservices, CDN, and DRM';
    case 'mindmap': return 'e.g. Launch a SaaS product';
    case 'mermaid': return 'Paste mermaid code here... e.g. flowchart TD A[Start] --> B[End]';
    case 'code': return 'Paste backend code here...';
    case 'meeting': return 'Paste the meeting transcript here...';
    case 'brainstorm': return 'e.g. Marketing ideas for a whiteboard app';
    case 'voice': return 'Describe what you want to draw...';
    default: return 'Type your prompt...';
  }
}

let uid = 0;
const nid = () => `ai_${Date.now().toString(36)}_${uid++}`;

function componentsToElements(arch) {
  const els = [];
  let y = 40;
  (arch.layers || arch.components || []).forEach((layer, i) => {
    const label = typeof layer === 'string' ? layer : layer.name;
    els.push({
      id: nid(), type: 'rectangle', x: 60, y, width: 220, height: 70,
      text: label, fill: ['#6366f1', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'][i % 5],
      stroke: '#475569', strokeWidth: 2, borderRadius: 10, fontSize: 15, fontWeight: 600,
    });
    y += 110;
  });
  return els;
}

function meetingToStickies(summary) {
  const els = [];
  let x = 60, y = 60;
  const add = (text, color) => {
    els.push({ id: nid(), type: 'sticky', x, y, width: 200, height: 90, text, fill: color, fontSize: 13, textAlign: 'left' });
    x += 230;
    if (x > 900) { x = 60; y += 120; }
  };
  add(`📋 Summary\n${summary.summary?.slice(0, 120) || ''}`, '#fef08a');
  (summary.actionItems || []).forEach((a) => add(`✅ ${a.task}`, '#bbf7d0'));
  (summary.decisions || []).forEach((d) => add(`⚡ ${d}`, '#bae6fd'));
  (summary.risks || []).forEach((r) => add(`⚠️ ${r}`, '#fecaca'));
  return els;
}

function ideasToStickies(ideas) {
  return (ideas || []).map((idea, i) => ({
    id: nid(), type: 'sticky', x: 60 + (i % 3) * 230, y: 60 + Math.floor(i / 3) * 130,
    width: 200, height: 110, text: `${idea.title}\n\n${idea.description || ''}`,
    fill: ['#fef08a', '#bbf7d0', '#bae6fd', '#fde68a', '#ddd6fe'][i % 5], fontSize: 13, textAlign: 'left',
  }));
}
