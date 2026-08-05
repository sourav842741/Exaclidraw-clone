import { BaseRepository } from './base.repo.js';
import { User } from '../models/user.model.js';

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  findByEmail(email, includePassword = false) {
    return this.model.findOne({ email: email.toLowerCase() })
      .select(includePassword ? '+password' : '-__v');
  }

  findByIdWithPassword(id) {
    return this.model.findById(id).select('+password');
  }

  incrementAiUsage(id) {
    return this.model.findByIdAndUpdate(id, { $inc: { 'aiUsage.requests': 1 } }, { new: true });
  }

  touchLastActive(id) {
    return this.model.findByIdAndUpdate(id, { lastActiveAt: new Date() }, { new: true });
  }
}

export const userRepository = new UserRepository();
