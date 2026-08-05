import mongoose from 'mongoose';

const kanbanSchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', default: null },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    name: { type: String, default: 'Project Board' },
    columns: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        color: { type: String, default: '#94a3b8' },
        order: { type: Number, default: 0 },
      },
    ],
    tasks: [
      {
        id: { type: String, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        columnId: { type: String, required: true },
        order: { type: Number, default: 0 },
        labels: [{ type: String }],
        priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
        dueDate: { type: Date, default: null },
        assignee: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
        subtasks: [
          {
            id: { type: String, required: true },
            title: { type: String, required: true },
            done: { type: Boolean, default: false },
          },
        ],
        createdAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

export const Kanban = mongoose.model('Kanban', kanbanSchema);
