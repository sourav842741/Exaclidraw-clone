import { Router } from 'express';
import { projectController } from '../controllers/project.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createProjectSchema,
  updateProjectSchema,
  columnSchema,
  renameColumnSchema,
  taskSchema,
  moveTaskSchema,
  updateTaskSchema,
} from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/', projectController.list);
router.post('/', validate(createProjectSchema), projectController.create);
router.get('/timeline', projectController.timeline);
router.get('/calendar', projectController.calendar);

router.get('/:id', projectController.get);
router.put('/:id', validate(updateProjectSchema), projectController.update);
router.delete('/:id', projectController.remove);

router.get('/:id/kanban', projectController.kanban);
router.post('/:id/columns', validate(columnSchema), projectController.addColumn);
router.put('/:id/columns/:columnId', validate(renameColumnSchema), projectController.renameColumn);
router.delete('/:id/columns/:columnId', projectController.deleteColumn);
router.post('/:id/tasks', validate(taskSchema), projectController.addTask);
router.put('/:id/tasks/:taskId', validate(updateTaskSchema), projectController.updateTask);
router.put('/:id/tasks/:taskId/move', validate(moveTaskSchema), projectController.moveTask);
router.delete('/:id/tasks/:taskId', projectController.deleteTask);

export default router;
