import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema(
  {
    date: { type: String, required: true, index: true },
    metric: { type: String, required: true, index: true },
    value: { type: Number, default: 0 },
    extra: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true },
);

analyticsSchema.index({ metric: 1, date: 1 }, { unique: true });

export const Analytics = mongoose.model('Analytics', analyticsSchema);
