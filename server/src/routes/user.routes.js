import { Router } from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { uploadImage } from '../middlewares/upload.js';
import { validate } from '../middlewares/validate.js';
import { updateProfileSchema, passwordSchema, emailSchema } from '../validators/index.js';

const router = Router();

router.use(authenticate);

router.get('/me', userController.me);
router.put('/me', validate(updateProfileSchema), userController.updateProfile);
router.put('/password', validate(passwordSchema), userController.updatePassword);
router.put('/email', validate(emailSchema), userController.changeEmail);
router.post('/avatar', uploadImage.single('avatar'), userController.uploadAvatar);
router.get('/boards', userController.myBoards);
router.get('/teams', userController.myTeams);
router.get('/dashboard', userController.dashboard);

export default router;
