import { BaseRepository } from './base.repo.js';
import { Board } from '../models/board.model.js';

class BoardRepository extends BaseRepository {
  constructor() {
    super(Board);
  }

  findForUser(userId, query = {}, options = {}) {
    const filter = {
      isDeleted: false,
      $or: [
        { owner: userId },
        { 'collaborators.user': userId },
        { isPublic: true },
      ],
      ...query,
    };
    return this.findMany(filter, options);
  }

  countForUser(userId) {
    return this.count({
      isDeleted: false,
      $or: [{ owner: userId }, { 'collaborators.user': userId }],
    });
  }

  updateStats(id, elementCount, storageBytes) {
    return this.updateById(id, { 'stats.elementCount': elementCount, 'stats.storageBytes': storageBytes });
  }

  async softDelete(id) {
    return this.model.findByIdAndUpdate(id, { isDeleted: true, deletedAt: new Date() }, { new: true });
  }

  async restore(id) {
    return this.model.findByIdAndUpdate(id, { isDeleted: false, deletedAt: null }, { new: true });
  }
}

export const boardRepository = new BoardRepository();
