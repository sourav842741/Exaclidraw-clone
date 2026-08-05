import { BaseRepository } from './base.repo.js';
import { Team } from '../models/team.model.js';

class TeamRepository extends BaseRepository {
  constructor() {
    super(Team);
  }

  findForUser(userId, options = {}) {
    return this.findMany({ 'members.user': userId }, options);
  }

  isMember(teamId, userId) {
    return this.findOne({ _id: teamId, 'members.user': userId });
  }

  getMemberRole(team, userId) {
    if (!team) return null;
    const member = team.members.find((m) => String(m.user) === String(userId));
    return member ? member.role : null;
  }

  addMember(teamId, userId, role = 'editor') {
    return this.updateById(teamId, { $push: { members: { user: userId, role, joinedAt: new Date() } } });
  }

  removeMember(teamId, userId) {
    return this.updateById(teamId, { $pull: { members: { user: userId } } });
  }
}

export const teamRepository = new TeamRepository();
