import { adminService } from '../services/admin.service.js';
import { asyncHandler, success } from '../utils/response.js';

export const adminController = {
  stats: asyncHandler(async (req, res) => {
    adminService.assertAdmin(req.user);
    const stats = await adminService.stats();
    success(res, 200, stats);
  }),

  users: asyncHandler(async (req, res) => {
    adminService.assertAdmin(req.user);
    const result = await adminService.listUsers(req.query);
    success(res, 200, result);
  }),

  updateUser: asyncHandler(async (req, res) => {
    const user = await adminService.updateUser(req.user, req.params.id, req.body);
    success(res, 200, { user });
  }),

  deleteUser: asyncHandler(async (req, res) => {
    await adminService.deleteUser(req.user, req.params.id);
    success(res, 200, {}, 'User deleted');
  }),

  boards: asyncHandler(async (req, res) => {
    adminService.assertAdmin(req.user);
    const result = await adminService.listBoards(req.query);
    success(res, 200, result);
  }),

  analytics: asyncHandler(async (req, res) => {
    adminService.assertAdmin(req.user);
    const result = await adminService.analytics(parseInt(req.query.days, 10) || 30);
    success(res, 200, result);
  }),

  subscriptions: asyncHandler(async (req, res) => {
    adminService.assertAdmin(req.user);
    const result = await adminService.subscriptions();
    success(res, 200, result);
  }),
};
