import { BaseRepository } from './base.repo.js';
import { BoardVersion } from '../models/boardVersion.model.js';

class BoardVersionRepository extends BaseRepository {
  constructor() {
    super(BoardVersion);
  }
}

export const boardVersionRepo = new BoardVersionRepository();
