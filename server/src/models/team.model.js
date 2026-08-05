import mongoose from 'mongoose';

const teamSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, unique: true, sparse: true, lowercase: true },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    members: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        role: { type: String, enum: ['owner', 'admin', 'editor', 'viewer'], default: 'editor' },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    avatar: { type: String, default: '' },
    boards: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Board' }],
    settings: {
      allowGuestLinks: { type: Boolean, default: true },
      requireInvite: { type: Boolean, default: false },
    },
  },
  { timestamps: true },
);

export const Team = mongoose.model('Team', teamSchema);
