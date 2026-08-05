import { Router } from 'express';
import { adminController } from '../controllers/admin.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { authorize } from '../middlewares/rbac.js';
import { apiLimiter } from '../middlewares/rateLimit.js';

const router = Router();

router.use(authenticate, authorize('admin'), apiLimiter);

router.get('/stats', adminController.stats);
router.get('/users', adminController.users);
router.put('/users/:id', adminController.updateUser);
router.delete('/users/:id', adminController.deleteUser);
router.get('/boards', adminController.boards);
router.get('/analytics', adminController.analytics);
router.get('/subscriptions', adminController.subscriptions);

export default router;
