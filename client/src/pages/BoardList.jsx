import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import Layout from '../components/layout/Layout.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import { boardApi } from '../api/index.js';

export default function BoardList() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [view, setView] = useState('active'); // active | trash
  const [confirmDelete, setConfirmDelete] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['boards', view],
    queryFn: () => boardApi.list({ trash: view === 'trash' }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => boardApi.trash(id),
    onSuccess: () => {
      toast.success('Board moved to trash');
      qc.invalidateQueries(['boards']);
    },
    onError: (err) => toast.error(err.response?.data?.message),
  });

  const restoreMutation = useMutation({
    mutationFn: (id) => boardApi.restore(id),
    onSuccess: () => {
      toast.success('Board restored');
      qc.invalidateQueries(['boards']);
    },
  });

  const purgeMutation = useMutation({
    mutationFn: (id) => boardApi.hardDelete(id),
    onSuccess: () => {
      toast.success('Board permanently deleted');
      qc.invalidateQueries(['boards']);
      setConfirmDelete(null);
    },
  });

  const boards = data?.boards || [];

  return (
    <Layout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Boards</h1>
        <div className="flex items-center gap-2">
          <Button variant={view === 'active' ? 'primary' : 'secondary'} onClick={() => setView('active')}>Active</Button>
          <Button variant={view === 'trash' ? 'primary' : 'secondary'} onClick={() => setView('trash')}>Trash</Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <div key={i} className="card h-36 animate-pulse" />)}
        </div>
      ) : boards.length === 0 ? (
        <div className="card text-center py-16 text-gray-500">
          <div className="text-5xl mb-4">🗂️</div>
          {view === 'trash' ? 'Trash is empty' : 'No boards yet. Create one to get started.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {boards.map((board) => (
            <div key={board.id} className="card group">
              <div
                className="h-28 rounded-lg mb-3 bg-gradient-to-br from-primary-100 to-purple-100 dark:from-primary-900/40 dark:to-purple-900/40 flex items-center justify-center text-4xl cursor-pointer"
                onClick={() => navigate(`/board/${board.id}`)}
              >
                {board.type === 'flowchart' ? '🔀' : board.type === 'mindmap' ? '🧠' : board.type === 'architecture' ? '🏛️' : '📝'}
              </div>
              <h3 className="font-semibold truncate">{board.name}</h3>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-400">{new Date(board.updatedAt).toLocaleDateString()}</span>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {view === 'active' ? (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => navigate(`/board/${board.id}`)}>Open</Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(board.id)} title="Trash">🗑️</Button>
                    </>
                  ) : (
                    <>
                      <Button size="sm" variant="ghost" onClick={() => restoreMutation.mutate(board.id)}>Restore</Button>
                      <Button size="sm" variant="danger" onClick={() => setConfirmDelete(board)}>Delete</Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Permanently delete board?" width="max-w-sm">
        <p className="text-sm text-gray-500 mb-4">
          <strong>{confirmDelete?.name}</strong> will be permanently deleted along with all versions and comments. This cannot be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button variant="danger" onClick={() => purgeMutation.mutate(confirmDelete.id)}>Delete Forever</Button>
        </div>
      </Modal>
    </Layout>
  );
}
