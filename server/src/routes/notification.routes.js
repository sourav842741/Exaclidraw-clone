import { Router } from 'express';
import { notificationController } from '../controllers/notification.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.list);
router.get('/unread', notificationController.unread);
router.put('/read-all', notificationController.markAllRead);
router.put('/:id/read', notificationController.markRead);

export default router;
