import mongoose from 'mongoose';

const boardVersionSchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    version: { type: Number, required: true },
    elements: { type: mongoose.Schema.Types.Mixed, required: true },
    state: { type: mongoose.Schema.Types.Mixed, default: {} },
    snapshot: { type: Buffer, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    label: { type: String, default: '' },
    size: { type: Number, default: 0 },
  },
  { timestamps: true },
);

boardVersionSchema.index({ boardId: 1, version: -1 });

export const BoardVersion = mongoose.model('BoardVersion', boardVersionSchema);
