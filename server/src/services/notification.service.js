import { notificationRepository } from '../repositories/notification.repo.js';
import { publishToQueue, QUEUES } from '../config/rabbitmq.js';
import { redis, pubSub } from '../config/redis.js';

const NOTIF_CHANNEL = 'vectorshare:notifications';

export class NotificationService {
  async createForUser(recipient, { type, title, message, data = {}, link = '' }) {
    const notification = await notificationRepository.create({
      recipient,
      type,
      title,
      message,
      data,
      link,
    });

    try {
      const payload = {
        recipientId: String(recipient),
        notification: notification.toObject(),
      };
      await publishToQueue(QUEUES.NOTIFICATIONS, payload);
      await pubSub.publish(NOTIF_CHANNEL, JSON.stringify(payload));
    } catch {
      // queuing is best-effort
    }

    const unread = await this.unreadCount(recipient);
    return { notification, unread };
  }

  async list(userId, query = {}) {
    const page = Math.max(parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(parseInt(query.limit, 10) || 20, 50);
    const skip = (page - 1) * limit;
    const [notifications, total] = await Promise.all([
      notificationRepository.findMany({ recipient: userId }, {
        sort: { createdAt: -1 },
        skip,
        limit,
      }),
      notificationRepository.count({ recipient: userId }),
    ]);
    return { notifications, total, page, pages: Math.ceil(total / limit) || 1 };
  }

  unreadCount(userId) {
    return notificationRepository.unreadCount(userId);
  }

  markRead(userId, notificationId) {
    return notificationRepository.updateOne(
      { _id: notificationId, recipient: userId },
      { read: true },
    );
  }

  markAllRead(userId) {
    return notificationRepository.markAllRead(userId);
  }

  async broadcastToUser(userId, payload) {
    const channel = `vectorshare:presence:${userId}`;
    await pubSub.publish(channel, JSON.stringify(payload));
  }

  async getPresence(userId) {
    return redis.get(`vectorshare:online:${userId}`);
  }

  async setPresence(userId, data, ttl = 60) {
    await redis.set(`vectorshare:online:${userId}`, JSON.stringify(data), 'EX', ttl);
  }

  async clearPresence(userId) {
    await redis.del(`vectorshare:online:${userId}`);
  }
}

export const notificationService = new NotificationService();
