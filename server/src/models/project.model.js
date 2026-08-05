import mongoose from 'mongoose';

const projectSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    status: { type: String, enum: ['planning', 'active', 'paused', 'done', 'archived'], default: 'planning' },
    color: { type: String, default: '#6366f1' },
    startDate: { type: Date, default: null },
    dueDate: { type: Date, default: null },
    board: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', default: null },
    labels: [{ name: { type: String }, color: { type: String } }],
  },
  { timestamps: true },
);

projectSchema.index({ team: 1 });
projectSchema.index({ owner: 1 });

export const Project = mongoose.model('Project', projectSchema);
