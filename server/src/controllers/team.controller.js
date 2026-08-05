import { teamService } from '../services/team.service.js';
import { asyncHandler, success } from '../utils/response.js';

export const teamController = {
  create: asyncHandler(async (req, res) => {
    const team = await teamService.createTeam(req.user._id, req.body);
    success(res, 201, { team });
  }),

  list: asyncHandler(async (req, res) => {
    const teams = await teamService.listTeams(req.user._id);
    success(res, 200, { teams });
  }),

  get: asyncHandler(async (req, res) => {
    const team = await teamService.getTeam(req.params.id, req.user._id);
    success(res, 200, { team });
  }),

  update: asyncHandler(async (req, res) => {
    const team = await teamService.updateTeam(req.params.id, req.user._id, req.body);
    success(res, 200, { team });
  }),

  remove: asyncHandler(async (req, res) => {
    await teamService.deleteTeam(req.params.id, req.user._id);
    success(res, 200, {}, 'Team deleted');
  }),

  invite: asyncHandler(async (req, res) => {
    const result = await teamService.inviteByEmail(req.params.id, req.user._id, req.body.emails, req.body.role);
    success(res, 200, result);
  }),

  join: asyncHandler(async (req, res) => {
    const result = await teamService.joinByToken(req.query.token);
    success(res, 200, result);
  }),

  updateMember: asyncHandler(async (req, res) => {
    await teamService.updateMemberRole(req.params.id, req.user._id, req.params.memberId, req.body.role);
    success(res, 200, {}, 'Member updated');
  }),

  removeMember: asyncHandler(async (req, res) => {
    await teamService.removeMember(req.params.id, req.user._id, req.params.memberId);
    success(res, 200, {}, 'Member removed');
  }),
};
