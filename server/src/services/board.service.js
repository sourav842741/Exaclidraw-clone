import { v4 as uuidv4 } from 'uuid';
import { boardRepository } from '../repositories/board.repo.js';
import { Comment } from '../models/comment.model.js';
import { NotFound, Forbidden } from '../utils/errors.js';
import { redis } from '../config/redis.js';
import { boardVersionRepo } from '../repositories/boardVersion.repo.js';

export class BoardService {
  async createBoard(userId, { name, type = 'whiteboard', team = null, description = '' }) {
    const board = await boardRepository.create({
      name: name || `Untitled ${type}`,
      type,
      description,
      owner: userId,
      team: team || null,
      collaborators: [{ user: userId, role: 'owner' }],
      shareLink: uuidv4().replace(/-/g, '').slice(0, 16),
    });
    return this.serialize(board);
  }

  async getBoard(boardId, userId) {
    const board = await this.authorize(boardId, userId, ['viewer', 'commenter', 'editor', 'owner']);
    await cacheBoard(boardId, this.serialize(board));
    return this.serialize(board);
  }

  async listBoards(userId, query = {}) {
    const filter = {};
    if (query.team) filter.team = query.team;
    if (query.type) filter.type = query.type;
    if (query.trash === 'true') {
      const boards = await boardRepository.findMany(
        { owner: userId, isDeleted: true },
        { sort: { deletedAt: -1 }, select: 'name type thumbnail deletedAt stats' },
      );
      return boards;
    }
    const boards = await boardRepository.findForUser(userId, filter, {
      sort: { updatedAt: -1 },
      select: 'name type thumbnail isPublic collaborators updatedAt createdAt owner team stats state',
    });
    return boards.map((b) => this.serialize(b));
  }

  async updateBoard(boardId, userId, data) {
    await this.authorize(boardId, userId, ['owner', 'editor']);
    const allowed = ['name', 'description', 'type', 'background', 'isPublic', 'password', 'settings', 'state', 'thumbnail'];
    const patch = {};
    for (const key of allowed) if (data[key] !== undefined) patch[key] = data[key];
    const board = await boardRepository.updateById(boardId, patch, { runValidators: true });
    return this.serialize(board);
  }

  async saveElements(boardId, userId, { elements, state, version }) {
    await this.authorize(boardId, userId, ['owner', 'editor']);
    const board = await boardRepository.updateById(boardId, {
      elements,
      state: state || undefined,
      lastEditedBy: userId,
      'stats.elementCount': Array.isArray(elements) ? elements.length : 0,
      'stats.storageBytes': Buffer.byteLength(JSON.stringify(elements)),
    });
    return { saved: true, version: board ? board.updatedAt : version };
  }

  async trash(boardId, userId) {
    await this.authorize(boardId, userId, ['owner']);
    await boardRepository.softDelete(boardId);
    return { trashed: true };
  }

  async restore(boardId, userId) {
    const board = await boardRepository.findById(boardId);
    if (!board) throw NotFound('Board not found');
    if (String(board.owner) !== String(userId)) throw Forbidden('Only owner can restore');
    await boardRepository.restore(boardId);
    return { restored: true };
  }

  async hardDelete(boardId, userId) {
    const board = await boardRepository.findById(boardId);
    if (!board) throw NotFound('Board not found');
    if (String(board.owner) !== String(userId)) throw Forbidden('Only owner can permanently delete');
    await Promise.all([
      boardRepository.deleteById(boardId),
      boardVersionRepo.deleteMany({ boardId }),
      Comment.deleteMany({ boardId }),
    ]);
    return { deleted: true };
  }

  async duplicate(boardId, userId) {
    const board = await boardRepository.findById(boardId);
    if (!board) throw NotFound('Board not found');
    const clone = await boardRepository.create({
      name: `${board.name} (copy)`,
      type: board.type,
      description: board.description,
      owner: userId,
      collaborators: [{ user: userId, role: 'owner' }],
      elements: board.elements,
      state: board.state,
      shareLink: uuidv4().replace(/-/g, '').slice(0, 16),
    });
    return this.serialize(clone);
  }

  async getVersions(boardId, userId) {
    await this.authorize(boardId, userId, ['viewer', 'commenter', 'editor', 'owner']);
    return boardVersionRepo.findMany(
      { boardId },
      { sort: { version: -1 }, select: 'version label createdAt createdBy size' },
    );
  }

  async createVersion(boardId, userId, { elements, state, label }) {
    await this.authorize(boardId, userId, ['owner', 'editor']);
    const last = await boardVersionRepo.findOne({ boardId }, 'version', { sort: { version: -1 } });
    const version = (last ? last.version : 0) + 1;
    const doc = await boardVersionRepo.create({
      boardId,
      version,
      elements,
      state,
      createdBy: userId,
      label: label || `Version ${version}`,
      size: Buffer.byteLength(JSON.stringify(elements)),
    });
    return { version: doc.version, id: doc._id };
  }

  async restoreVersion(boardId, userId, versionId) {
    await this.authorize(boardId, userId, ['owner', 'editor']);
    const versionDoc = await boardVersionRepo.findById(versionId);
    if (!versionDoc || String(versionDoc.boardId) !== String(boardId)) throw NotFound('Version not found');
    await boardRepository.updateById(boardId, { elements: versionDoc.elements, state: versionDoc.state });
    return { restored: versionDoc.version };
  }

  async authorize(boardId, userId, allowedRoles) {
    let board;
    try {
      const cached = await redis.get(`board:${boardId}:meta`);
      if (cached) board = JSON.parse(cached);
    } catch {
      board = null;
    }
    if (!board) {
      board = await boardRepository.findById(boardId);
      if (board) await cacheBoard(boardId, this.serialize(board));
    }
    if (!board || board.isDeleted) throw NotFound('Board not found');

    const role = this.getUserRole(board, userId);
    if (allowedRoles.includes(role)) return board;
    if (board.isPublic && allowedRoles.includes('viewer')) return board;
    throw Forbidden('You do not have access to this board');
  }

  getUserRole(board, userId) {
    if (String(board.owner) === String(userId)) return 'owner';
    const collab = (board.collaborators || []).find((c) => String(c.user) === String(userId));
    if (collab) return collab.role;
    return null;
  }

  serialize(board) {
    if (!board || typeof board.toObject !== 'function') return board;
    const o = board.toObject();
    return {
      ...o,
      id: String(o._id),
      ownerId: String(o.owner),
      collaboratorIds: (o.collaborators || []).map((c) => String(c.user)),
    };
  }
}

async function cacheBoard(boardId, serialized) {
  try {
    await redis.setex(`board:${boardId}:meta`, 60, JSON.stringify(serialized));
  } catch {
    // cache is best-effort
  }
}

export const boardService = new BoardService();
