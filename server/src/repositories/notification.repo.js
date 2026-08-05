import { BaseRepository } from './base.repo.js';
import { Notification } from '../models/notification.model.js';

class NotificationRepository extends BaseRepository {
  constructor() {
    super(Notification);
  }

  forUser(userId, options = {}) {
    return this.findMany({ recipient: userId }, options);
  }

  unreadCount(userId) {
    return this.count({ recipient: userId, read: false });
  }

  markAllRead(userId) {
    return this.updateMany({ recipient: userId, read: false }, { read: true });
  }
}

export const notificationRepository = new NotificationRepository();
