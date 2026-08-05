import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Layout from '../components/layout/Layout.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import { userApi, boardApi } from '../api/index.js';

const boardTypes = [
  { value: 'whiteboard', label: 'Whiteboard', emoji: '📝' },
  { value: 'flowchart', label: 'Flowchart', emoji: '🔀' },
  { value: 'architecture', label: 'Architecture', emoji: '🏛️' },
  { value: 'mindmap', label: 'Mind Map', emoji: '🧠' },
  { value: 'er', label: 'ER Diagram', emoji: '🗄️' },
  { value: 'sequence', label: 'Sequence', emoji: '🔁' },
  { value: 'wireframe', label: 'Wireframe', emoji: '🖼️' },
  { value: 'uml', label: 'UML', emoji: '📐' },
  { value: 'network', label: 'Network', emoji: '🌐' },
  { value: 'organization', label: 'Org Chart', emoji: '🏢' },
  { value: 'api', label: 'API Diagram', emoji: '🔌' },
  { value: 'database', label: 'Database', emoji: '💾' },
  { value: 'decisiontree', label: 'Decision Tree', emoji: '🌳' },
  { value: 'userjourney', label: 'User Journey', emoji: '🗺️' },
  { value: 'sitemap', label: 'Sitemap', emoji: '🧭' },
  { value: 'businessmodel', label: 'Business Model', emoji: '💼' },
  { value: 'kanban', label: 'Kanban', emoji: '📋' },
  { value: 'slides', label: 'Slides', emoji: '📊' },
  { value: 'documentation', label: 'Docs', emoji: '📄' },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState('');
  const [type, setType] = useState('whiteboard');
  const [creating, setCreating] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => userApi.dashboard(),
  });

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { board } = await boardApi.create({ name: name || `Untitled ${type}`, type });
      toast.success('Board created');
      navigate(`/board/${board.id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create board');
    } finally {
      setCreating(false);
    }
  };

  const boards = data?.boards || [];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Welcome back 👋</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Here's what's happening in your workspace</p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <span className="text-lg leading-none">+</span> New Board
        </Button>
      </div>

      <div className="grid gap-4 mb-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Boards', value: boards.length, icon: '📊' },
          { label: 'Teams', value: data?.teams?.length || 0, icon: '👥' },
          { label: 'AI Requests', value: data?.user?.aiUsage?.requests ?? 0, icon: '🤖' },
          { label: 'Storage', value: `${((data?.user?.aiUsage?.requests ?? 0) * 12) % 1024} KB`, icon: '💾' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="card"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center text-xl">{stat.icon}</div>
              <div>
                <p className="text-2xl font-bold">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Recent Boards</h2>
        <Button variant="ghost" onClick={() => navigate('/boards')}>View all</Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="card h-40 animate-pulse" />)}
        </div>
      ) : boards.length === 0 ? (
        <div className="card text-center py-16">
          <div className="text-5xl mb-4">🎨</div>
          <h3 className="text-lg font-semibold mb-2">Create your first board</h3>
          <p className="text-sm text-gray-500 mb-6">Start with a blank whiteboard or use AI to generate a diagram</p>
          <Button onClick={() => setCreateOpen(true)}>Create a Board</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {boards.map((board) => {
            const meta = boardTypes.find((t) => t.value === board.type) || boardTypes[0];
            return (
              <motion.div
                key={board.id}
                whileHover={{ y: -3 }}
                onClick={() => navigate(`/board/${board.id}`)}
                className="card cursor-pointer group"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-2xl">{meta.emoji}</span>
                  <span className="text-xs text-gray-400">{board.type}</span>
                </div>
                <h3 className="font-semibold truncate group-hover:text-primary-600 transition-colors">{board.name}</h3>
                <div className="flex items-center justify-between mt-4 text-xs text-gray-400">
                  <span>{board.collaboratorIds?.length || 1} collaborators</span>
                  <span>{new Date(board.updatedAt).toLocaleDateString()}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create a new board">
        <form onSubmit={handleCreate}>
          <div className="mb-4">
            <label className="label" htmlFor="board-name">Board name</label>
            <input id="board-name" className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={`Untitled ${type}`} />
          </div>
          <div className="mb-6">
            <label className="label">Board type</label>
            <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
              {boardTypes.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setType(t.value)}
                  className={`p-2 rounded-lg border text-center transition-colors ${
                    type === t.value
                      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  <div className="text-xl">{t.emoji}</div>
                  <div className="text-xs mt-1">{t.label}</div>
                </button>
              ))}
            </div>
          </div>
          <Button type="submit" className="w-full" disabled={creating}>{creating ? 'Creating...' : 'Create Board'}</Button>
        </form>
      </Modal>
    </Layout>
  );
}
