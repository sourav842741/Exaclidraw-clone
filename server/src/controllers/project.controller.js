import { projectService } from '../services/project.service.js';
import { asyncHandler, success } from '../utils/response.js';

export const projectController = {
  create: asyncHandler(async (req, res) => {
    const project = await projectService.createProject(req.user._id, req.body);
    success(res, 201, { project });
  }),

  list: asyncHandler(async (req, res) => {
    const projects = await projectService.listProjects(req.user._id, req.query.team);
    success(res, 200, { projects });
  }),

  get: asyncHandler(async (req, res) => {
    const project = await projectService.getProject(req.params.id, req.user._id);
    success(res, 200, { project });
  }),

  update: asyncHandler(async (req, res) => {
    const project = await projectService.updateProject(req.params.id, req.user._id, req.body);
    success(res, 200, { project });
  }),

  remove: asyncHandler(async (req, res) => {
    await projectService.deleteProject(req.params.id, req.user._id);
    success(res, 200, {}, 'Project deleted');
  }),

  timeline: asyncHandler(async (req, res) => {
    const timeline = await projectService.timeline(req.user._id, req.query.team);
    success(res, 200, { timeline });
  }),

  calendar: asyncHandler(async (req, res) => {
    const events = await projectService.calendar(req.user._id, req.query.team);
    success(res, 200, { events });
  }),

  // Kanban
  kanban: asyncHandler(async (req, res) => {
    const kanban = await projectService.getKanban(req.params.id, req.user._id);
    success(res, 200, { kanban });
  }),

  addColumn: asyncHandler(async (req, res) => {
    const column = await projectService.addColumn(req.params.id, req.user._id, req.body);
    success(res, 201, { column });
  }),

  renameColumn: asyncHandler(async (req, res) => {
    const column = await projectService.renameColumn(req.params.id, req.user._id, req.params.columnId, req.body);
    success(res, 200, { column });
  }),

  deleteColumn: asyncHandler(async (req, res) => {
    await projectService.deleteColumn(req.params.id, req.user._id, req.params.columnId);
    success(res, 200, {}, 'Column deleted');
  }),

  addTask: asyncHandler(async (req, res) => {
    const task = await projectService.addTask(req.params.id, req.user._id, req.body);
    success(res, 201, { task });
  }),

  updateTask: asyncHandler(async (req, res) => {
    const task = await projectService.updateTask(req.params.id, req.user._id, req.params.taskId, req.body);
    success(res, 200, { task });
  }),

  moveTask: asyncHandler(async (req, res) => {
    const task = await projectService.moveTask(req.params.id, req.user._id, req.params.taskId, req.body);
    success(res, 200, { task });
  }),

  deleteTask: asyncHandler(async (req, res) => {
    await projectService.deleteTask(req.params.id, req.user._id, req.params.taskId);
    success(res, 200, {}, 'Task deleted');
  }),
};
