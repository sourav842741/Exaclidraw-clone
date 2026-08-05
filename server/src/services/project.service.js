import { v4 as uuidv4 } from 'uuid';
import { Kanban } from '../models/kanban.model.js';
import { Project } from '../models/project.model.js';
import { boardRepository } from '../repositories/board.repo.js';
import { NotFound, Forbidden } from '../utils/errors.js';

const DEFAULT_COLUMNS = [
  { id: uuidv4(), title: 'Backlog', color: '#94a3b8', order: 0 },
  { id: uuidv4(), title: 'To Do', color: '#6366f1', order: 1 },
  { id: uuidv4(), title: 'In Progress', color: '#f59e0b', order: 2 },
  { id: uuidv4(), title: 'Done', color: '#10b981', order: 3 },
];

export class ProjectService {
  async createProject(userId, { name, description, team, color, startDate, dueDate }) {
    const board = await boardRepository.create({
      name: `${name} Board`,
      type: 'kanban',
      owner: userId,
      team: team || null,
      collaborators: [{ user: userId, role: 'owner' }],
    });
    const project = await Project.create({
      name,
      description,
      owner: userId,
      team: team || null,
      color,
      startDate,
      dueDate,
      board: board._id,
    });
    await Kanban.create({ projectId: project._id, boardId: board._id, owner: userId, columns: DEFAULT_COLUMNS });
    return project;
  }

  async listProjects(userId, teamId) {
    const filter = teamId ? { team: teamId } : { $or: [{ owner: userId }, { members: userId }] };
    return Project.find(filter).sort({ updatedAt: -1 }).populate('team owner');
  }

  async getProject(projectId, userId) {
    const project = await Project.findById(projectId).populate('team owner board');
    if (!project) throw NotFound('Project not found');
    await this.assertAccess(project, userId);
    return project;
  }

  async updateProject(projectId, userId, data) {
    const project = await Project.findById(projectId);
    if (!project) throw NotFound('Project not found');
    await this.assertAccess(project, userId, ['owner']);
    const allowed = ['name', 'description', 'status', 'color', 'startDate', 'dueDate'];
    const patch = {};
    for (const key of allowed) if (data[key] !== undefined) patch[key] = data[key];
    return Project.findByIdAndUpdate(projectId, patch, { new: true });
  }

  async deleteProject(projectId, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw NotFound('Project not found');
    await this.assertAccess(project, userId, ['owner']);
    await Promise.all([
      Project.findByIdAndDelete(projectId),
      Kanban.findOneAndDelete({ projectId }),
      boardRepository.deleteById(project.board),
    ]);
    return { deleted: true };
  }

  // ----- Kanban -----

  async getKanban(projectId, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw NotFound('Project not found');
    await this.assertAccess(project, userId);
    const kanban = await Kanban.findOne({ projectId }).populate('tasks.assignee');
    if (!kanban) throw NotFound('Board not found');
    return kanban;
  }

  async addColumn(projectId, userId, { title, color }) {
    await this.mustEdit(projectId, userId);
    const kanban = await Kanban.findOne({ projectId });
    const order = kanban.columns.length;
    const column = { id: uuidv4(), title, color: color || '#94a3b8', order };
    kanban.columns.push(column);
    await kanban.save();
    return column;
  }

  async renameColumn(projectId, userId, columnId, { title, color }) {
    await this.mustEdit(projectId, userId);
    const kanban = await Kanban.findOne({ projectId });
    const col = kanban.columns.find((c) => c.id === columnId);
    if (!col) throw NotFound('Column not found');
    if (title !== undefined) col.title = title;
    if (color !== undefined) col.color = color;
    await kanban.save();
    return col;
  }

  async deleteColumn(projectId, userId, columnId) {
    await this.mustEdit(projectId, userId);
    const kanban = await Kanban.findOne({ projectId });
    kanban.columns = kanban.columns.filter((c) => c.id !== columnId);
    kanban.tasks = kanban.tasks.filter((t) => t.columnId !== columnId);
    await kanban.save();
    return { deleted: true };
  }

  async addTask(projectId, userId, { title, columnId, description, labels, priority, dueDate, assignee, subtasks }) {
    await this.mustEdit(projectId, userId);
    const kanban = await Kanban.findOne({ projectId });
    if (!kanban) throw NotFound('Board not found');
    const col = kanban.columns.find((c) => c.id === columnId);
    const targetColumn = col ? columnId : kanban.columns[0].id;
    const order = kanban.tasks.filter((t) => t.columnId === targetColumn).length;
    const task = {
      id: uuidv4(),
      title,
      columnId: targetColumn,
      order,
      description: description || '',
      labels: labels || [],
      priority: priority || 'medium',
      dueDate: dueDate || null,
      assignee: assignee || null,
      subtasks: subtasks || [],
    };
    kanban.tasks.push(task);
    await kanban.save();
    return task;
  }

  async updateTask(projectId, userId, taskId, data) {
    await this.mustEdit(projectId, userId);
    const kanban = await Kanban.findOne({ projectId });
    const task = kanban.tasks.find((t) => t.id === taskId);
    if (!task) throw NotFound('Task not found');
    const allowed = ['title', 'description', 'labels', 'priority', 'dueDate', 'assignee'];
    for (const key of allowed) if (data[key] !== undefined) task[key] = data[key];
    if (data.columnId) {
      task.columnId = data.columnId;
      task.order = kanban.tasks.filter((t) => t.columnId === data.columnId).length;
    }
    if (data.subtasks !== undefined) {
      if (data.subtasks.done !== undefined) {
        const sub = task.subtasks.find((s) => s.id === data.subtasks.id);
        if (sub) sub.done = data.subtasks.done;
      }
    }
    await kanban.save();
    return task;
  }

  async moveTask(projectId, userId, taskId, { columnId, order }) {
    await this.mustEdit(projectId, userId);
    const kanban = await Kanban.findOne({ projectId });
    const task = kanban.tasks.find((t) => t.id === taskId);
    if (!task) throw NotFound('Task not found');
    task.columnId = columnId || task.columnId;
    task.order = order ?? kanban.tasks.filter((t) => t.columnId === task.columnId).length;
    await kanban.save();
    return task;
  }

  async deleteTask(projectId, userId, taskId) {
    await this.mustEdit(projectId, userId);
    const kanban = await Kanban.findOne({ projectId });
    kanban.tasks = kanban.tasks.filter((t) => t.id !== taskId);
    await kanban.save();
    return { deleted: true };
  }

  async timeline(userId, teamId) {
    const filter = teamId ? { team: teamId } : { $or: [{ owner: userId }, { members: userId }] };
    const projects = await Project.find(filter).populate('team owner');
    return projects.map((p) => ({
      id: String(p._id),
      name: p.name,
      start: p.startDate,
      end: p.dueDate,
      color: p.color,
      status: p.status,
    }));
  }

  async calendar(userId, teamId) {
    const filter = teamId ? { team: teamId } : { $or: [{ owner: userId }, { members: userId }] };
    const projects = await Project.find(filter);
    const kanbans = await Kanban.find({ projectId: { $in: projects.map((p) => p._id) } });
    const events = [];
    for (const k of kanbans) {
      for (const t of k.tasks) {
        if (t.dueDate) {
          events.push({
            id: t.id,
            title: t.title,
            start: t.dueDate,
            end: t.dueDate,
            color: t.priority === 'high' ? '#ef4444' : t.priority === 'urgent' ? '#dc2626' : '#6366f1',
          });
        }
      }
    }
    return events;
  }

  async assertAccess(project, userId, roles = []) {
    const isOwner = String(project.owner) === String(userId);
    const isMember = project.members.some((m) => String(m) === String(userId));
    if (roles.includes('owner')) {
      if (!isOwner) throw Forbidden('Only the project owner can do this');
    } else if (!isOwner && !isMember) {
      throw Forbidden('You do not have access to this project');
    }
  }

  async mustEdit(projectId, userId) {
    const project = await Project.findById(projectId);
    if (!project) throw NotFound('Project not found');
    await this.assertAccess(project, userId);
  }
}

export const projectService = new ProjectService();
