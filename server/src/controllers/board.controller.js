import { boardService } from '../services/board.service.js';
import { commentService } from '../services/comment.service.js';
import { exportService } from '../services/export.service.js';
import { asyncHandler, success } from '../utils/response.js';

export const boardController = {
  create: asyncHandler(async (req, res) => {
    const board = await boardService.createBoard(req.user._id, req.body);
    success(res, 201, { board });
  }),

  list: asyncHandler(async (req, res) => {
    const boards = await boardService.listBoards(req.user._id, req.query);
    success(res, 200, { boards });
  }),

  get: asyncHandler(async (req, res) => {
    const board = await boardService.getBoard(req.params.id, req.user._id);
    success(res, 200, { board });
  }),

  update: asyncHandler(async (req, res) => {
    const board = await boardService.updateBoard(req.params.id, req.user._id, req.body);
    success(res, 200, { board });
  }),

  saveElements: asyncHandler(async (req, res) => {
    const result = await boardService.saveElements(req.params.id, req.user._id, req.body);
    success(res, 200, result);
  }),

  trash: asyncHandler(async (req, res) => {
    await boardService.trash(req.params.id, req.user._id);
    success(res, 200, {}, 'Board moved to trash');
  }),

  restore: asyncHandler(async (req, res) => {
    await boardService.restore(req.params.id, req.user._id);
    success(res, 200, {}, 'Board restored');
  }),

  hardDelete: asyncHandler(async (req, res) => {
    await boardService.hardDelete(req.params.id, req.user._id);
    success(res, 200, {}, 'Board permanently deleted');
  }),

  duplicate: asyncHandler(async (req, res) => {
    const board = await boardService.duplicate(req.params.id, req.user._id);
    success(res, 201, { board });
  }),

  versions: asyncHandler(async (req, res) => {
    const versions = await boardService.getVersions(req.params.id, req.user._id);
    success(res, 200, { versions });
  }),

  createVersion: asyncHandler(async (req, res) => {
    const result = await boardService.createVersion(req.params.id, req.user._id, req.body);
    success(res, 201, result);
  }),

  restoreVersion: asyncHandler(async (req, res) => {
    const result = await boardService.restoreVersion(req.params.id, req.user._id, req.params.versionId);
    success(res, 200, result);
  }),

  // Comments
  listComments: asyncHandler(async (req, res) => {
    const comments = await commentService.list(req.params.id, req.user._id);
    success(res, 200, { comments });
  }),

  addComment: asyncHandler(async (req, res) => {
    const comment = await commentService.create(req.params.id, req.user._id, req.body);
    success(res, 201, { comment });
  }),

  replyComment: asyncHandler(async (req, res) => {
    const comment = await commentService.reply(req.params.id, req.params.commentId, req.user._id, req.body);
    success(res, 200, { comment });
  }),

  resolveComment: asyncHandler(async (req, res) => {
    const comment = await commentService.resolve(req.params.id, req.params.commentId, req.user._id, req.body.resolved);
    success(res, 200, { comment });
  }),

  deleteComment: asyncHandler(async (req, res) => {
    await commentService.delete(req.params.id, req.params.commentId, req.user._id);
    success(res, 200, {}, 'Comment deleted');
  }),

  // Exports
  exportSVG: asyncHandler(async (req, res) => {
    const { content, contentType, filename } = await exportService.exportSVG(req.params.id, req.user._id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }),

  exportJSON: asyncHandler(async (req, res) => {
    const { content, contentType, filename } = await exportService.exportJSON(req.params.id, req.user._id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }),

  exportMarkdown: asyncHandler(async (req, res) => {
    const { content, contentType, filename } = await exportService.exportMarkdown(req.params.id, req.user._id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }),

  exportMermaid: asyncHandler(async (req, res) => {
    const { content, contentType, filename } = await exportService.exportMermaid(req.params.id, req.user._id);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(content);
  }),

  exportPNG: asyncHandler(async (req, res) => {
    const result = await exportService.exportPNG(req.params.id, req.user._id, req.query);
    res.setHeader('Content-Type', result.contentType);
    res.send(result.content);
  }),

  exportPDF: asyncHandler(async (req, res) => {
    const result = await exportService.exportPDF(req.params.id, req.user._id);
    res.setHeader('Content-Type', result.contentType);
    res.send(result.content);
  }),
};
