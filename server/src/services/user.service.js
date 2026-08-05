import { userRepository } from '../repositories/user.repo.js';
import { teamRepository } from '../repositories/team.repo.js';
import { boardRepository } from '../repositories/board.repo.js';
import { BadRequest, NotFound } from '../utils/errors.js';
import { cloudinary } from '../config/cloudinary.js';
import fs from 'node:fs';

export class UserService {
  async getProfile(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw NotFound('User not found');
    return user.toPublicJSON();
  }

  async updateProfile(userId, data) {
    const allowed = ['name', 'settings'];
    const patch = {};
    for (const key of allowed) {
      if (data[key] !== undefined) patch[key] = data[key];
    }
    const user = await userRepository.updateById(userId, patch);
    return user.toPublicJSON();
  }

  async updatePassword(userId, { currentPassword, newPassword }) {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) throw NotFound('User not found');
    const ok = await user.comparePassword(currentPassword);
    if (!ok) throw BadRequest('Current password is incorrect');
    await userRepository.updateById(userId, { password: newPassword });
    return { updated: true };
  }

  async changeEmail(userId, { email }) {
    const exists = await userRepository.findByEmail(email);
    if (exists) throw BadRequest('Email already in use');
    await userRepository.updateById(userId, { email, isEmailVerified: false });
    return { updated: true };
  }

  async updateAvatar(userId, file) {
    if (!file) throw BadRequest('No file uploaded');
    let url = null;
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: 'vectorshare/avatars',
        width: 256,
        height: 256,
        crop: 'limit',
      });
      url = result.secure_url;
    } catch {
      throw BadRequest('Avatar upload failed');
    } finally {
      fs.unlink(file.path, () => {});
    }
    await userRepository.updateById(userId, { avatar: url });
    return { avatar: url };
  }

  async listUserBoards(userId) {
    return boardRepository.findForUser(userId, {}, {
      sort: { updatedAt: -1 },
      select: 'name type thumbnail isPublic collaborators updatedAt createdAt owner stats',
    });
  }

  async listUserTeams(userId) {
    return teamRepository.findForUser(userId, {}, { populate: 'owner' });
  }
}

export const userService = new UserService();
