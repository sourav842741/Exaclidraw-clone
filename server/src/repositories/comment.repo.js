import { BaseRepository } from './base.repo.js';
import { Comment } from '../models/comment.model.js';

class CommentRepository extends BaseRepository {
  constructor() {
    super(Comment);
  }

  async populate(comment, path) {
    return comment.populate(path);
  }
}

export const commentRepository = new CommentRepository();
