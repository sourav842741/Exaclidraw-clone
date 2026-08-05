import { Router } from 'express';
import { aiController } from '../controllers/ai.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { aiLimiter, uploadLimiter } from '../middlewares/rateLimit.js';
import { validate } from '../middlewares/validate.js';
import { uploadDocument } from '../middlewares/upload.js';
import {
  aiDiagramSchema,
  mermaidSchema,
  mindmapSchema,
  codeSchema,
  transcriptSchema,
  brainstormSchema,
  voiceSchema,
} from '../validators/index.js';

const router = Router();

router.use(authenticate, aiLimiter);

router.post('/diagram', validate(aiDiagramSchema), aiController.diagram);
router.post('/flowchart', validate(aiDiagramSchema), aiController.flowchart);
router.post('/mermaid', validate(mermaidSchema), aiController.mermaid);
router.post('/mindmap', validate(mindmapSchema), aiController.mindmap);
router.post('/code', validate(codeSchema), aiController.codeToArch);
router.post('/meeting', validate(transcriptSchema), aiController.meeting);
router.post('/brainstorm', validate(brainstormSchema), aiController.brainstorm);
router.post('/voice', validate(voiceSchema), aiController.voice);
router.post('/image', uploadLimiter, uploadDocument.single('image'), aiController.image);
router.post('/board', aiController.createBoard);

export default router;
