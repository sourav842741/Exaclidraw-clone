import { Forbidden } from '../utils/errors.js';

export const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return next(Forbidden('Not authenticated'));
  if (!roles.includes(req.user.role)) {
    return next(Forbidden('You do not have permission to perform this action'));
  }
  return next();
};

export const requireEmailVerified = (req, res, next) => {
  if (!req.user.isEmailVerified) {
    return next(Forbidden('Please verify your email address first'));
  }
  return next();
};
