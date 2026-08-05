import { commentRepository } from '../repositories/comment.repo.js';
import { boardService } from './board.service.js';
import { NotFound, BadRequest } from '../utils/errors.js';

export class CommentService {
  async list(boardId, userId) {
    await boardService.authorize(boardId, userId, ['viewer', 'commenter', 'editor', 'owner']);
    return commentRepository.findMany({ boardId }, { sort: { createdAt: 1 }, populate: 'author' });
  }

  async create(boardId, userId, { body, x, y, elementId }) {
    await boardService.authorize(boardId, userId, ['commenter', 'editor', 'owner']);
    if (!body?.trim()) throw BadRequest('Comment cannot be empty');
    const comment = await commentRepository.create({ boardId, author: userId, body, x, y, elementId });
    await commentRepository.populate(comment, 'author');
    return comment;
  }

  async reply(boardId, commentId, userId, { body }) {
    await boardService.authorize(boardId, userId, ['commenter', 'editor', 'owner']);
    const comment = await commentRepository.findById(commentId);
    if (!comment) throw NotFound('Comment not found');
    comment.replies.push({ author: userId, body });
    await comment.save();
    return comment;
  }

  async resolve(boardId, commentId, userId, resolved) {
    await boardService.authorize(boardId, userId, ['commenter', 'editor', 'owner']);
    const comment = await commentRepository.updateById(commentId, { resolved });
    return comment;
  }

  async delete(boardId, commentId, userId) {
    await boardService.authorize(boardId, userId, ['owner', 'editor']);
    const comment = await commentRepository.findById(commentId);
    if (!comment) throw NotFound('Comment not found');
    if (String(comment.author) !== String(userId)) {
      const board = await boardService.authorize(boardId, userId, ['owner']);
      const role = boardService.getUserRole(board, userId);
      if (role !== 'owner') throw new (await import('../utils/errors.js')).Forbidden('Cannot delete this comment');
    }
    await commentRepository.deleteById(commentId);
    return { deleted: true };
  }
}

export const commentService = new CommentService();
