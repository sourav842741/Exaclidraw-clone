import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema(
  {
    boardId: { type: mongoose.Schema.Types.ObjectId, ref: 'Board', required: true, index: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    body: { type: String, required: true, maxlength: 5000 },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    elementId: { type: String, default: null },
    replies: [
      {
        author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        body: { type: String },
        createdAt: { type: Date, default: Date.now },
      },
    ],
    resolved: { type: Boolean, default: false },
  },
  { timestamps: true },
);

export const Comment = mongoose.model('Comment', commentSchema);
