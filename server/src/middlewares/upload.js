import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { BadRequest } from '../utils/errors.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '../../../storage/uploads');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const imageFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(BadRequest('Only image files are allowed'));
};

const documentFilter = (req, file, cb) => {
  const allowed = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'application/pdf', 'text/plain']);
  if (allowed.has(file.mimetype)) cb(null, true);
  else cb(BadRequest('Unsupported file type'));
};

export const uploadImage = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: imageFilter,
});

export const uploadDocument = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: documentFilter,
});

export const uploadsDir = uploadDir;
