import { randomBytes } from 'node:crypto';

export function generateToken(length = 32) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  const bytes = randomBytes(length);
  for (let i = 0; i < bytes.length; i += 1) result += chars[bytes[i] % chars.length];
  return result;
}

export function randomHex(bytes = 16) {
  return randomBytes(bytes).toString('hex');
}

export function sanitizeObject(obj) {
  const clone = { ...obj };
  for (const key of Object.keys(clone)) {
    if (clone[key] === undefined) delete clone[key];
  }
  return clone;
}

export function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function paginate({ page = 1, limit = 20 }) {
  const p = Math.max(parseInt(page, 10) || 1, 1);
  const l = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);
  return { skip: (p - 1) * l, limit: l, page: p };
}

export function buildPagination(total, page, limit) {
  return {
    total,
    page,
    limit,
    pages: Math.ceil(total / limit) || 1,
  };
}

export const slugify = (str) =>
  str.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
