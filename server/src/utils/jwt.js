import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { Unauthorized } from './errors.js';

export function signAccessToken(payload) {
  return jwt.sign(payload, env.jwt.accessSecret, { expiresIn: env.jwt.accessExpires });
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, env.jwt.refreshSecret, { expiresIn: env.jwt.refreshExpires });
}

export function signEmailToken(payload) {
  return jwt.sign(payload, env.jwt.emailSecret, { expiresIn: '24h' });
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, env.jwt.accessSecret);
  } catch {
    throw Unauthorized('Invalid or expired access token');
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, env.jwt.refreshSecret);
  } catch {
    throw Unauthorized('Invalid or expired refresh token');
  }
}

export function verifyEmailToken(token) {
  try {
    return jwt.verify(token, env.jwt.emailSecret);
  } catch {
    throw Unauthorized('Invalid or expired verification token');
  }
}
