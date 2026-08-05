import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['mention', 'comment', 'invite', 'share', 'task', 'system', 'ai', 'reaction'],
      required: true,
    },
    title: { type: String, required: true },
    message: { type: String, default: '' },
    read: { type: Boolean, default: false },
    data: { type: mongoose.Schema.Types.Mixed, default: {} },
    link: { type: String, default: '' },
  },
  { timestamps: true },
);

notificationSchema.index({ recipient: 1, read: 1, createdAt: -1 });

export const Notification = mongoose.model('Notification', notificationSchema);
