import { notificationService } from '../services/notification.service.js';
import { asyncHandler, success } from '../utils/response.js';

export const notificationController = {
  list: asyncHandler(async (req, res) => {
    const result = await notificationService.list(req.user._id, req.query);
    success(res, 200, result);
  }),

  unread: asyncHandler(async (req, res) => {
    const count = await notificationService.unreadCount(req.user._id);
    success(res, 200, { count });
  }),

  markRead: asyncHandler(async (req, res) => {
    await notificationService.markRead(req.user._id, req.params.id);
    success(res, 200, {}, 'Marked as read');
  }),

  markAllRead: asyncHandler(async (req, res) => {
    await notificationService.markAllRead(req.user._id);
    success(res, 200, {}, 'All notifications marked as read');
  }),
};
