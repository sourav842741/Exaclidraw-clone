import { verifyAccessToken } from '../utils/jwt.js';
import { userRepository } from '../repositories/user.repo.js';
import { Unauthorized } from '../utils/errors.js';

export async function authenticate(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    if (!header.startsWith('Bearer ')) throw Unauthorized('Authentication required');
    const token = header.slice(7);
    const payload = verifyAccessToken(token);
    const user = await userRepository.findById(payload.sub);
    if (!user || !user.isActive) throw Unauthorized('User not found or deactivated');
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

export const optionalAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    if (header.startsWith('Bearer ')) {
      const payload = verifyAccessToken(header.slice(7));
      const user = await userRepository.findById(payload.sub);
      if (user && user.isActive) req.user = user;
    }
  } catch {
    // optional
  }
  next();
};
