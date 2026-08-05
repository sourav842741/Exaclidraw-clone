import { aiService } from '../services/ai.service.js';
import { asyncHandler, success } from '../utils/response.js';

export const aiController = {
  diagram: asyncHandler(async (req, res) => {
    const result = await aiService.diagramFromPrompt(req.user._id, req.body);
    success(res, 200, { result });
  }),

  flowchart: asyncHandler(async (req, res) => {
    const result = await aiService.diagramFromPrompt(req.user._id, { ...req.body, type: 'flowchart' });
    success(res, 200, { result });
  }),

  mermaid: asyncHandler(async (req, res) => {
    const result = await aiService.mermaidToDiagram(req.user._id, req.body);
    success(res, 200, { result });
  }),

  mindmap: asyncHandler(async (req, res) => {
    const result = await aiService.mindmap(req.user._id, req.body);
    success(res, 200, { result });
  }),

  codeToArch: asyncHandler(async (req, res) => {
    const result = await aiService.codeToArchitecture(req.user._id, req.body);
    success(res, 200, { result });
  }),

  meeting: asyncHandler(async (req, res) => {
    const result = await aiService.meetingAssistant(req.user._id, req.body);
    success(res, 200, { result });
  }),

  brainstorm: asyncHandler(async (req, res) => {
    const result = await aiService.brainstormingNotes(req.user._id, req.body);
    success(res, 200, { result });
  }),

  voice: asyncHandler(async (req, res) => {
    const result = await aiService.voiceToDiagram(req.user._id, req.body);
    success(res, 200, { result });
  }),

  image: asyncHandler(async (req, res) => {
    const result = await aiService.imageToDiagram(req.user._id, req.file);
    success(res, 200, { result });
  }),

  createBoard: asyncHandler(async (req, res) => {
    const board = await aiService.createBoardFromAI(req.user._id, req.body);
    success(res, 201, { board });
  }),
};
