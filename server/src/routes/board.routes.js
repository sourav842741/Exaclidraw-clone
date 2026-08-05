import { Router } from 'express';
import { boardController } from '../controllers/board.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  createBoardSchema,
  updateBoardSchema,
  saveElementsSchema,
  commentSchema,
  replySchema,
  resolveSchema,
} from '../validators/board.validator.js';

const router = Router();

router.use(authenticate);

router.get('/', boardController.list);
router.post('/', validate(createBoardSchema), boardController.create);

// Comments
router.get('/:id/comments', boardController.listComments);
router.post('/:id/comments', validate(commentSchema), boardController.addComment);
router.post('/:id/comments/:commentId/reply', validate(replySchema), boardController.replyComment);
router.put('/:id/comments/:commentId/resolve', validate(resolveSchema), boardController.resolveComment);
router.delete('/:id/comments/:commentId', boardController.deleteComment);

// Versions
router.get('/:id/versions', boardController.versions);
router.post('/:id/versions', boardController.createVersion);
router.post('/:id/versions/:versionId/restore', boardController.restoreVersion);

// Exports
router.get('/:id/export/svg', boardController.exportSVG);
router.get('/:id/export/json', boardController.exportJSON);
router.get('/:id/export/markdown', boardController.exportMarkdown);
router.get('/:id/export/mermaid', boardController.exportMermaid);
router.get('/:id/export/png', boardController.exportPNG);
router.get('/:id/export/pdf', boardController.exportPDF);

router.get('/:id', boardController.get);
router.put('/:id', validate(updateBoardSchema), boardController.update);
router.post('/:id/elements', validate(saveElementsSchema), boardController.saveElements);
router.post('/:id/duplicate', boardController.duplicate);
router.delete('/:id', boardController.trash);
router.post('/:id/restore', boardController.restore);
router.delete('/:id/permanent', boardController.hardDelete);

export default router;
