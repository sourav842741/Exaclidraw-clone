import { Router } from 'express';
import { teamController } from '../controllers/team.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import { createTeamSchema, updateTeamSchema, inviteSchema, memberRoleSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/', teamController.list);
router.post('/', validate(createTeamSchema), teamController.create);
router.get('/invite/join', teamController.join);
router.get('/:id', teamController.get);
router.put('/:id', validate(updateTeamSchema), teamController.update);
router.delete('/:id', teamController.remove);
router.post('/:id/invite', validate(inviteSchema), teamController.invite);
router.put('/:id/members/:memberId', validate(memberRoleSchema), teamController.updateMember);
router.delete('/:id/members/:memberId', teamController.removeMember);

export default router;
