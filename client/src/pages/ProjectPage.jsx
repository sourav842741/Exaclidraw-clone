import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import Layout from '../components/layout/Layout.jsx';
import Button from '../components/common/Button.jsx';
import Modal from '../components/common/Modal.jsx';
import { projectApi } from '../api/index.js';

const priorityColors = { low: '#94a3b8', medium: '#f59e0b', high: '#ef4444', urgent: '#dc2626' };

export default function ProjectPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [view, setView] = useState('board'); // board | timeline | calendar
  const [taskModal, setTaskModal] = useState(null); // columnId
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskPriority, setTaskPriority] = useState('medium');
  const [taskDue, setTaskDue] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [detailTask, setDetailTask] = useState(null);

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => projectApi.list(),
    enabled: !id,
  });

  const { data: project } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectApi.get(id),
    enabled: !!id,
  });

  const { data: kanban } = useQuery({
    queryKey: ['kanban', id],
    queryFn: () => projectApi.kanban(id),
    enabled: !!id,
  });

  const { data: timeline } = useQuery({
    queryKey: ['timeline', id],
    queryFn: () => projectApi.timeline(),
    enabled: view === 'timeline' && !id,
  });

  const { data: calendar } = useQuery({
    queryKey: ['calendar', id],
    queryFn: () => projectApi.calendar(),
    enabled: view === 'calendar' && !id,
  });

  const createProject = useMutation({
    mutationFn: (payload) => projectApi.create(payload),
    onSuccess: (data) => { toast.success('Project created'); setCreateOpen(false); navigate(`/project/${data.project._id}`); },
    onError: (err) => toast.error(err.response?.data?.message),
  });

  const addTask = useMutation({
    mutationFn: () => projectApi.addTask(id, { title: taskTitle, description: taskDesc, priority: taskPriority, dueDate: taskDue || null, columnId: taskModal }),
    onSuccess: () => { toast.success('Task added'); qc.invalidateQueries(['kanban', id]); setTaskModal(null); setTaskTitle(''); setTaskDesc(''); setTaskDue(''); },
    onError: (err) => toast.error(err.response?.data?.message),
  });

  const moveTask = useMutation({
    mutationFn: ({ taskId, columnId }) => projectApi.moveTask(id, taskId, { columnId }),
    onSuccess: () => qc.invalidateQueries(['kanban', id]),
  });

  const updateTask = useMutation({
    mutationFn: ({ taskId, payload }) => projectApi.updateTask(id, taskId, payload),
    onSuccess: () => { qc.invalidateQueries(['kanban', id]); setDetailTask(null); },
  });

  const deleteTask = useMutation({
    mutationFn: (taskId) => projectApi.deleteTask(id, taskId),
    onSuccess: () => { toast.success('Task deleted'); qc.invalidateQueries(['kanban', id]); setDetailTask(null); },
  });

  const addColumn = useMutation({
    mutationFn: () => projectApi.addColumn(id, { title: 'New Column' }),
    onSuccess: () => qc.invalidateQueries(['kanban', id]),
  });

  const dragOverCol = (e) => e.preventDefault();

  const dropTask = (e, columnId) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData('text/plain');
    if (taskId) moveTask.mutate({ taskId, columnId });
  };

  const priorityLabel = (p) => ({ low: 'Low', medium: 'Medium', high: 'High', urgent: 'Urgent' }[p] || p);

  return (
    <Layout>
      {!id ? (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Projects</h1>
              <div className="flex gap-2 mt-2">
                <Button variant={view === 'board' ? 'primary' : 'secondary'} onClick={() => setView('board')}>Board</Button>
                <Button variant={view === 'timeline' ? 'primary' : 'secondary'} onClick={() => setView('timeline')}>Timeline</Button>
                <Button variant={view === 'calendar' ? 'primary' : 'secondary'} onClick={() => setView('calendar')}>Calendar</Button>
              </div>
            </div>
            <Button onClick={() => setCreateOpen(true)}>+ New Project</Button>
          </div>

          {view === 'board' && (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {(projects?.projects || []).map((p) => (
                <div key={p._id} className="card cursor-pointer hover:shadow-lg transition-shadow" onClick={() => navigate(`/project/${p._id}`)}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold" style={{ background: p.color || '#6366f1' }}>{p.name?.charAt(0)?.toUpperCase()}</div>
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-100 dark:bg-gray-800 capitalize">{p.status}</span>
                  </div>
                  <h3 className="font-semibold">{p.name}</h3>
                  <p className="text-xs text-gray-400 mt-1">{p.description || 'No description'}</p>
                  {p.dueDate && <p className="text-xs text-gray-500 mt-2">Due: {new Date(p.dueDate).toLocaleDateString()}</p>}
                </div>
              ))}
              {(projects?.projects || []).length === 0 && <div className="card col-span-full text-center py-16 text-gray-400">No projects yet</div>}
            </div>
          )}

          {view === 'timeline' && (
            <div className="card">
              {(timeline?.timeline || []).map((t) => (
                <div key={t.id} className="mb-4">
                  <p className="text-sm font-medium mb-1">{t.name} <span className="text-xs text-gray-400 capitalize">({t.status})</span></p>
                  <div className="h-6 rounded-lg relative" style={{ background: t.color || '#6366f1', opacity: 0.85 }}>
                    <div className="absolute -top-1 left-0 text-[10px] text-white px-2">
                      {t.start ? new Date(t.start).toLocaleDateString() : 'Start'} → {t.end ? new Date(t.end).toLocaleDateString() : 'Open'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {view === 'calendar' && (
            <div className="card">
              <h3 className="font-semibold mb-4">Upcoming due dates</h3>
              <div className="space-y-2">
                {(calendar?.events || []).map((e) => (
                  <div key={e.id} className="flex items-center gap-3 p-2 rounded-lg border border-gray-200 dark:border-gray-700">
                    <div className="w-2 h-8 rounded" style={{ background: e.color || '#6366f1' }} />
                    <span className="text-sm">{e.title}</span>
                    <span className="text-xs text-gray-400 ml-auto">{new Date(e.start).toLocaleDateString()}</span>
                  </div>
                ))}
                {(calendar?.events || []).length === 0 && <p className="text-sm text-gray-400 text-center py-6">No upcoming tasks</p>}
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <div>
              <button onClick={() => navigate('/projects')} className="text-sm text-gray-400 hover:text-gray-600 mb-1">← All projects</button>
              <h1 className="text-2xl font-bold">{project?.name}</h1>
              <p className="text-sm text-gray-400">{project?.description}</p>
            </div>
            <Button variant="secondary" onClick={() => addColumn.mutate()}>+ Column</Button>
          </div>

          <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '60vh' }}>
            {(kanban?.kanban?.columns || []).map((col) => {
              const tasks = (kanban?.kanban?.tasks || []).filter((t) => t.columnId === col.id).sort((a, b) => a.order - b.order);
              return (
                <div key={col.id} className="w-72 flex-shrink-0 bg-gray-100 dark:bg-gray-900 rounded-xl p-3 flex flex-col"
                  onDragOver={dragOverCol} onDrop={(e) => dropTask(e, col.id)}>
                  <div className="flex items-center justify-between mb-3 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: col.color || '#94a3b8' }} />
                      <span className="font-semibold text-sm">{col.title}</span>
                      <span className="text-xs text-gray-400">{tasks.length}</span>
                    </div>
                    <button onClick={() => setTaskModal(col.id)} className="btn-ghost !p-1 text-gray-400 hover:text-gray-600"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 5v14M5 12h14" /></svg></button>
                  </div>
                  <div className="flex-1 space-y-2 overflow-y-auto">
                    <AnimatePresence>
                      {tasks.map((task) => (
                        <motion.div
                          key={task.id}
                          layout
                          draggable
                          onDragStart={(e) => e.dataTransfer.setData('text/plain', task.id)}
                          onClick={() => setDetailTask(task)}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="card !p-3 cursor-grab active:cursor-grabbing"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex gap-1 flex-wrap">
                              {(task.labels || []).map((l) => <span key={l} className="text-[10px] px-1.5 py-0.5 rounded bg-primary-50 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300">{l}</span>)}
                            </div>
                            <span className="w-2 h-2 rounded-full" style={{ background: priorityColors[task.priority] }} title={priorityLabel(task.priority)} />
                          </div>
                          <p className="text-sm font-medium">{task.title}</p>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-[10px] text-gray-400">{task.subtasks?.length ? `${task.subtasks.filter((s) => s.done).length}/${task.subtasks.length}` : ''}</span>
                            {task.dueDate && <span className="text-[10px] text-gray-400">📅 {new Date(task.dueDate).toLocaleDateString()}</span>}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                    {tasks.length === 0 && <p className="text-xs text-gray-400 text-center py-6">Drop tasks here</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <Modal isOpen={!!taskModal} onClose={() => setTaskModal(null)} title="Add task">
        <div className="space-y-4">
          <div><label className="label">Title</label><input className="input" value={taskTitle} onChange={(e) => setTaskTitle(e.target.value)} placeholder="Task title" /></div>
          <div><label className="label">Description</label><textarea className="input min-h-[80px]" value={taskDesc} onChange={(e) => setTaskDesc(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label">Priority</label>
              <select className="input" value={taskPriority} onChange={(e) => setTaskPriority(e.target.value)}>
                {['low', 'medium', 'high', 'urgent'].map((p) => <option key={p} value={p}>{priorityLabel(p)}</option>)}
              </select>
            </div>
            <div><label className="label">Due date</label><input type="date" className="input" value={taskDue} onChange={(e) => setTaskDue(e.target.value)} /></div>
          </div>
          <Button className="w-full" onClick={() => addTask.mutate()} disabled={!taskTitle.trim()}>Add Task</Button>
        </div>
      </Modal>

      <Modal isOpen={!!detailTask} onClose={() => setDetailTask(null)} title="Task details">
        {detailTask && (
          <div className="space-y-4">
            <div><label className="label">Title</label><input className="input" defaultValue={detailTask.title} onBlur={(e) => updateTask.mutate({ taskId: detailTask.id, payload: { title: e.target.value } })} /></div>
            <div><label className="label">Description</label><textarea className="input min-h-[100px]" defaultValue={detailTask.description || ''} onBlur={(e) => updateTask.mutate({ taskId: detailTask.id, payload: { description: e.target.value } })} /></div>
            {detailTask.subtasks?.length > 0 && (
              <div>
                <label className="label">Subtasks</label>
                <div className="space-y-2">
                  {detailTask.subtasks.map((s) => (
                    <label key={s.id} className="flex items-center gap-2 text-sm">
                      <input type="checkbox" defaultChecked={s.done} onChange={(e) => updateTask.mutate({ taskId: detailTask.id, payload: { subtasks: { id: s.id, done: e.target.checked } } })} />
                      <span className={s.done ? 'line-through text-gray-400' : ''}>{s.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <Button variant="danger" className="w-full" onClick={() => deleteTask.mutate(detailTask.id)}>Delete Task</Button>
          </div>
        )}
      </Modal>

      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="Create project">
        <form onSubmit={(e) => { e.preventDefault(); createProject.mutate({ name: projectName }); }}>
          <label className="label" htmlFor="project-name">Project name</label>
          <input id="project-name" className="input mb-4" value={projectName} onChange={(e) => setProjectName(e.target.value)} required />
          <Button type="submit" className="w-full">Create Project</Button>
        </form>
      </Modal>
    </Layout>
  );
}
