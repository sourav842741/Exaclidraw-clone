import mongoose from 'mongoose';

const subscriptionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    plan: { type: String, enum: ['free', 'pro', 'team', 'enterprise'], default: 'free' },
    provider: { type: String, enum: ['stripe', 'paypal', 'manual'], default: 'stripe' },
    status: { type: String, enum: ['active', 'trialing', 'past_due', 'canceled', 'expired'], default: 'active' },
    currentPeriodStart: { type: Date },
    currentPeriodEnd: { type: Date },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    seats: { type: Number, default: 1 },
    stripeCustomerId: { type: String, default: '' },
    stripeSubscriptionId: { type: String, default: '' },
  },
  { timestamps: true },
);

export const Subscription = mongoose.model('Subscription', subscriptionSchema);
