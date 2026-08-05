import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { env } from './config/env.js';
import { User } from './models/user.model.js';
import { Team } from './models/team.model.js';
import { Board } from './models/board.model.js';
import { logger } from './utils/logger.js';

async function seed() {
  await mongoose.connect(env.mongoUri);
  logger.info('Connected, seeding...');

  const password = await bcrypt.hash('Password123!', 12);

  const admin = await User.findOneAndUpdate(
    { email: 'admin@vectorshare.ai' },
    { name: 'Admin', email: 'admin@vectorshare.ai', password, role: 'admin', isEmailVerified: true, plan: 'enterprise' },
    { upsert: true, new: true },
  );

  const demo = await User.findOneAndUpdate(
    { email: 'demo@vectorshare.ai' },
    { name: 'Demo User', email: 'demo@vectorshare.ai', password, role: 'user', isEmailVerified: true, plan: 'pro' },
    { upsert: true, new: true },
  );

  const team = await Team.findOneAndUpdate(
    { name: 'VectorShare Team' },
    { name: 'VectorShare Team', slug: 'vectorshare-team', owner: admin._id, members: [{ user: admin._id, role: 'owner' }, { user: demo._id, role: 'editor' }] },
    { upsert: true, new: true },
  );

  const board = await Board.findOneAndUpdate(
    { name: 'Welcome Board' },
    {
      name: 'Welcome Board',
      type: 'whiteboard',
      owner: admin._id,
      team: team._id,
      collaborators: [{ user: admin._id, role: 'owner' }, { user: demo._id, role: 'editor' }],
      elements: [
        { id: 'seed-1', type: 'rectangle', x: 100, y: 80, width: 260, height: 100, text: 'Welcome to VectorShare AI', fill: '#6366f1', stroke: '#4f46e5', strokeWidth: 2, borderRadius: 12, fontSize: 20, fontWeight: 700 },
        { id: 'seed-2', type: 'sticky', x: 440, y: 80, width: 220, height: 100, text: 'Collaborative whiteboard + AI diagrams', fill: '#fde047' },
        { id: 'seed-3', type: 'arrow', points: [[360, 130], [440, 130]], stroke: '#64748b', strokeWidth: 2 },
      ],
      state: { viewport: { x: 0, y: 0, scale: 1 }, gridEnabled: true },
    },
    { upsert: true, new: true },
  );

  logger.info(`Seeded: admin=${admin.email}, demo=${demo.email}, team=${team.name}, board=${board.name}`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  logger.error(err);
  process.exit(1);
});
