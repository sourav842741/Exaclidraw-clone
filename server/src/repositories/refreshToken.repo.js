import { BaseRepository } from './base.repo.js';
import { RefreshToken } from '../models/refreshToken.model.js';

class RefreshTokenRepository extends BaseRepository {
  constructor() {
    super(RefreshToken);
  }

  findByToken(token) {
    return this.model.findOne({ token });
  }

  revoke(token, replacedBy = null) {
    return this.model.findOneAndUpdate(
      { token },
      { revokedAt: new Date(), replacedBy },
      { new: true },
    );
  }

  revokeAllForUser(userId) {
    return this.model.updateMany(
      { userId, revokedAt: null },
      { revokedAt: new Date() },
    );
  }

  deleteExpired() {
    return this.model.deleteMany({ expiresAt: { $lt: new Date() } });
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
