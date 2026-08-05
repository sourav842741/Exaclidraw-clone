import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    password: { type: String, select: false, minlength: 8 },
    avatar: { type: String, default: '' },
    googleId: { type: String, unique: true, sparse: true },
    role: { type: String, enum: ['user', 'admin', 'moderator'], default: 'user' },
    isEmailVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    plan: {
      type: String,
      enum: ['free', 'pro', 'team', 'enterprise'],
      default: 'free',
    },
    settings: {
      theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
      defaultTool: { type: String, default: 'selection' },
      reduceMotion: { type: Boolean, default: false },
    },
    lastActiveAt: { type: Date, default: Date.now },
    passwordChangedAt: { type: Date },
    aiUsage: {
      requests: { type: Number, default: 0 },
      quota: { type: Number, default: 20 },
      resetAt: { type: Date, default: Date.now },
    },
  },
  { timestamps: true },
);

userSchema.pre('save', async function preSave(next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date();
  return next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    avatar: this.avatar,
    role: this.role,
    plan: this.plan,
    isEmailVerified: this.isEmailVerified,
    settings: this.settings,
    aiUsage: this.aiUsage,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model('User', userSchema);
