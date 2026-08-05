import { teamRepository } from '../repositories/team.repo.js';
import { userRepository } from '../repositories/user.repo.js';
import { Notification } from '../models/notification.model.js';
import { mailService } from '../utils/mail.js';
import { BadRequest, NotFound, Forbidden } from '../utils/errors.js';
import { slugify } from '../utils/helpers.js';
import { signEmailToken, verifyEmailToken } from '../utils/jwt.js';

export class TeamService {
  async createTeam(userId, { name, description }) {
    const slug = `${slugify(name)}-${Math.random().toString(36).slice(2, 7)}`;
    const team = await teamRepository.create({
      name,
      description,
      slug,
      owner: userId,
      members: [{ user: userId, role: 'owner', joinedAt: new Date() }],
    });
    return team;
  }

  async getTeam(teamId, userId) {
    const team = await teamRepository.findById(teamId).populate('owner members.user');
    if (!team) throw NotFound('Team not found');
    const role = teamRepository.getMemberRole(team, userId);
    if (!role && !team.settings.requireInvite) throw Forbidden('You are not a member of this team');
    if (!role && team.settings.requireInvite) throw Forbidden('You are not a member of this team');
    return team;
  }

  async listTeams(userId) {
    return teamRepository.findForUser(userId, {}, { populate: 'owner' });
  }

  async updateTeam(teamId, userId, data) {
    const team = await teamRepository.findById(teamId);
    if (!team) throw NotFound('Team not found');
    const role = teamRepository.getMemberRole(team, userId);
    if (!['owner', 'admin'].includes(role)) throw Forbidden('Only admins can edit this team');
    const allowed = ['name', 'description', 'avatar', 'settings'];
    const patch = {};
    for (const key of allowed) if (data[key] !== undefined) patch[key] = data[key];
    return teamRepository.updateById(teamId, patch);
  }

  async deleteTeam(teamId, userId) {
    const team = await teamRepository.findById(teamId);
    if (!team) throw NotFound('Team not found');
    if (String(team.owner) !== String(userId)) throw Forbidden('Only the owner can delete this team');
    await teamRepository.deleteById(teamId);
    return { deleted: true };
  }

  async inviteByEmail(teamId, inviterId, emails, role = 'editor') {
    const team = await teamRepository.findById(teamId);
    if (!team) throw NotFound('Team not found');
    const inviterRole = teamRepository.getMemberRole(team, inviterId);
    if (!['owner', 'admin', 'editor'].includes(inviterRole)) throw Forbidden('Not allowed to invite');

    const results = [];
    const inviter = await userRepository.findById(inviterId);

    for (const email of emails) {
      const existing = await userRepository.findByEmail(email);
      const token = signEmailToken({ sub: teamId.toString(), email, role, purpose: 'team-invite' });
      if (existing) {
        const already = team.members.some((m) => String(m.user) === String(existing._id));
        if (!already) {
          await teamRepository.addMember(teamId, existing._id, role);
          await Notification.create({
            recipient: existing._id,
            type: 'invite',
            title: `${inviter.name} invited you to ${team.name}`,
            message: `You've been added as ${role}`,
            link: `/teams/${teamId}`,
          });
        }
        results.push({ email, status: 'added' });
      } else {
        await mailService.sendTeamInviteEmail(email, inviter.name, team, token);
        results.push({ email, status: 'invited' });
      }
    }
    return { results };
  }

  async joinByToken(token) {
    const payload = verifyEmailToken(token);
    if (payload.purpose !== 'team-invite') throw BadRequest('Invalid invite link');
    const team = await teamRepository.findById(payload.sub);
    if (!team) throw NotFound('Team not found');
    const user = await userRepository.findByEmail(payload.email);
    if (!user) throw NotFound('User not found. Please register first.');
    const already = team.members.some((m) => String(m.user) === String(user._id));
    if (!already) {
      await teamRepository.addMember(team._id, user._id, payload.role);
    }
    return { team, joined: !already };
  }

  async updateMemberRole(teamId, adminId, memberId, role) {
    const team = await teamRepository.findById(teamId);
    if (!team) throw NotFound('Team not found');
    const adminRole = teamRepository.getMemberRole(team, adminId);
    if (!['owner', 'admin'].includes(adminRole)) throw Forbidden('Not allowed');
    if (String(memberId) === String(team.owner)) throw BadRequest('Cannot change the owner role');
    await teamRepository.updateById(teamId, { 'members.$[m].role': role }, {
      arrayFilters: [{ 'm.user': memberId }],
    });
    return { updated: true };
  }

  async removeMember(teamId, adminId, memberId) {
    const team = await teamRepository.findById(teamId);
    if (!team) throw NotFound('Team not found');
    const adminRole = teamRepository.getMemberRole(team, adminId);
    if (!['owner', 'admin'].includes(adminRole)) throw Forbidden('Not allowed');
    if (String(memberId) === String(team.owner)) throw BadRequest('Cannot remove the owner');
    await teamRepository.removeMember(teamId, memberId);
    return { removed: true };
  }
}

export const teamService = new TeamService();
