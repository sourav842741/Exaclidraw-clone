import { User } from '../models/user.model.js';
import { Board } from '../models/board.model.js';
import { Team } from '../models/team.model.js';
import { Analytics } from '../models/analytics.model.js';
import { Subscription } from '../models/subscription.model.js';
import { Forbidden } from '../utils/errors.js';
import { userRepository } from '../repositories/user.repo.js';

export class AdminService {
  assertAdmin(user) {
    if (user.role !== 'admin') throw Forbidden('Admin access required');
  }

  async stats() {
    const [users, boards, teams, deletedBoards, subscribers, storage] = await Promise.all([
      User.countDocuments({}),
      Board.countDocuments({ isDeleted: false }),
      Team.countDocuments({}),
      Board.countDocuments({ isDeleted: true }),
      User.countDocuments({ plan: { $ne: 'free' } }),
      Board.aggregate([{ $group: { _id: null, total: { $sum: '$stats.storageBytes' } } }]),
    ]);
    const recentBoards = await Board.find({ isDeleted: false }).sort({ updatedAt: -1 }).limit(5)
      .select('name type updatedAt owner').populate('owner', 'name email avatar');
    const recentUsers = await User.find().sort({ createdAt: -1 }).limit(5)
      .select('name email plan role createdAt');
    const planBreakdown = await User.aggregate([
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]);
    return {
      users,
      boards,
      teams,
      deletedBoards,
      subscribers,
      storageBytes: storage[0]?.total || 0,
      planBreakdown,
      recentBoards,
      recentUsers,
    };
  }

  async listUsers(query = {}) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
    const filter = {};
    if (query.search) {
      filter.$or = [
        { name: new RegExp(query.search, 'i') },
        { email: new RegExp(query.search, 'i') },
      ];
    }
    if (query.role) filter.role = query.role;
    if (query.plan) filter.plan = query.plan;
    const [users, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      User.countDocuments(filter),
    ]);
    return { users, total, page, pages: Math.ceil(total / limit) || 1 };
  }

  async updateUser(admin, userId, data) {
    this.assertAdmin(admin);
    const allowed = ['role', 'plan', 'isActive', 'isEmailVerified', 'aiUsage'];
    const patch = {};
    for (const key of allowed) if (data[key] !== undefined) patch[key] = data[key];
    const user = await userRepository.updateById(userId, patch);
    return user.toPublicJSON();
  }

  async deleteUser(admin, userId) {
    this.assertAdmin(admin);
    if (String(admin._id) === String(userId)) throw Forbidden('Cannot delete your own admin account');
    await User.findByIdAndDelete(userId);
    return { deleted: true };
  }

  async listBoards(query = {}) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(query.limit, 10) || 20, 100);
    const filter = query.trash === 'true' ? { isDeleted: true } : { isDeleted: false };
    if (query.search) filter.name = new RegExp(query.search, 'i');
    const [boards, total] = await Promise.all([
      Board.find(filter).sort({ updatedAt: -1 }).skip((page - 1) * limit).limit(limit)
        .populate('owner', 'name email'),
      Board.countDocuments(filter),
    ]);
    return { boards, total, page, pages: Math.ceil(total / limit) || 1 };
  }

  async analytics(rangeDays = 30) {
    const since = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);
    const [signups, boards, aiUsage, active] = await Promise.all([
      User.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      Board.aggregate([
        { $match: { createdAt: { $gte: since }, isDeleted: false } },
        { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ]),
      User.aggregate([
        { $match: { 'aiUsage.requests': { $gt: 0 } } },
        { $group: { _id: null, total: { $sum: '$aiUsage.requests' } } },
      ]),
      User.countDocuments({ lastActiveAt: { $gte: since } }),
    ]);
    return { signups, boards, aiUsage: aiUsage[0]?.total || 0, activeUsers: active, rangeDays };
  }

  async subscriptions() {
    const subs = await Subscription.find().sort({ createdAt: -1 }).limit(100).populate('user', 'name email');
    const totals = await Subscription.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$plan', count: { $sum: 1 } } },
    ]);
    return { subscriptions: subs, totals };
  }

  async recordMetric(date, metric, value) {
    await Analytics.findOneAndUpdate(
      { date, metric },
      { $inc: { value } },
      { upsert: true, new: true },
    );
  }
}

export const adminService = new AdminService();
