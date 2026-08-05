import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import teamRoutes from './team.routes.js';
import boardRoutes from './board.routes.js';
import aiRoutes from './ai.routes.js';
import projectRoutes from './project.routes.js';
import notificationRoutes from './notification.routes.js';
import adminRoutes from './admin.routes.js';

const router = Router();

router.get('/health', (req, res) => res.json({ success: true, message: 'VectorShare AI API healthy', time: new Date().toISOString() }));
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/teams', teamRoutes);
router.use('/boards', boardRoutes);
router.use('/ai', aiRoutes);
router.use('/projects', projectRoutes);
router.use('/notifications', notificationRoutes);
router.use('/admin', adminRoutes);

export default router;
