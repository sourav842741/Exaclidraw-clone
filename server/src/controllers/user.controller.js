import { userService } from '../services/user.service.js';
import { boardService } from '../services/board.service.js';
import { teamService } from '../services/team.service.js';
import { asyncHandler, success } from '../utils/response.js';

export const userController = {
  me: asyncHandler(async (req, res) => {
    const user = await userService.getProfile(req.user._id);
    success(res, 200, { user });
  }),

  updateProfile: asyncHandler(async (req, res) => {
    const user = await userService.updateProfile(req.user._id, req.body);
    success(res, 200, { user });
  }),

  updatePassword: asyncHandler(async (req, res) => {
    await userService.updatePassword(req.user._id, req.body);
    success(res, 200, {}, 'Password updated');
  }),

  changeEmail: asyncHandler(async (req, res) => {
    await userService.changeEmail(req.user._id, req.body);
    success(res, 200, {}, 'Email updated. Verification required.');
  }),

  uploadAvatar: asyncHandler(async (req, res) => {
    const { avatar } = await userService.updateAvatar(req.user._id, req.file);
    success(res, 200, { avatar });
  }),

  myBoards: asyncHandler(async (req, res) => {
    const boards = await userService.listUserBoards(req.user._id, req.query);
    success(res, 200, { boards });
  }),

  myTeams: asyncHandler(async (req, res) => {
    const teams = await userService.listUserTeams(req.user._id);
    success(res, 200, { teams });
  }),

  dashboard: asyncHandler(async (req, res) => {
    const [boards, teams, recentBoards] = await Promise.all([
      boardService.listBoards(req.user._id, { limit: 5 }),
      teamService.listTeams(req.user._id),
      boardService.listBoards(req.user._id, { sort: 'recent' }),
    ]);
    success(res, 200, { boards, teams, recentBoards });
  }),
};
