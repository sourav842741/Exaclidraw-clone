import mongoose from 'mongoose';

const collaboratorSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    role: { type: String, enum: ['owner', 'editor', 'commenter', 'viewer'], default: 'editor' },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const boardSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    type: {
      type: String,
      enum: [
        'whiteboard', 'flowchart', 'architecture', 'mindmap', 'er',
        'sequence', 'wireframe', 'mockup', 'uml', 'network',
        'organization', 'api', 'database', 'decisiontree',
        'userjourney', 'sitemap', 'businessmodel', 'kanban',
        'slides', 'documentation', 'canvas',
      ],
      default: 'whiteboard',
    },
    description: { type: String, default: '' },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    team: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', default: null },
    collaborators: [collaboratorSchema],
    isPublic: { type: Boolean, default: false },
    shareLink: { type: String, unique: true, sparse: true },
    password: { type: String, default: '' },
    background: { type: String, default: 'transparent' },
    thumbnail: { type: String, default: '' },
    elements: { type: mongoose.Schema.Types.Mixed, default: [] },
    state: {
      viewport: { type: mongoose.Schema.Types.Mixed, default: { x: 0, y: 0, scale: 1 } },
      gridEnabled: { type: Boolean, default: true },
      snapToGrid: { type: Boolean, default: false },
      darkMode: { type: Boolean, default: false },
    },
    versions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'BoardVersion' }],
    settings: {
      allowComments: { type: Boolean, default: true },
      allowChat: { type: Boolean, default: true },
      autoSave: { type: Boolean, default: true },
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null },
    lastEditedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    stats: {
      elementCount: { type: Number, default: 0 },
      storageBytes: { type: Number, default: 0 },
    },
  },
  { timestamps: true },
);

boardSchema.index({ team: 1, isDeleted: 1 });
boardSchema.index({ owner: 1, isDeleted: 1 });
boardSchema.index({ updatedAt: -1 });

export const Board = mongoose.model('Board', boardSchema);
