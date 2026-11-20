import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import crypto from 'node:crypto';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const ALLOWED = new Set(['image/jpeg','image/png','image/webp','image/avif','image/tiff']);
const MAX_MB = Number(process.env.MAX_UPLOAD_MB || 15);
const EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp', 'image/avif': '.avif', 'image/tiff': '.tiff' };

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, UPLOAD_DIR),
  filename: (_, file, cb) => {
    const ext = EXTENSIONS[file.mimetype] || '.jpg';
    const name = crypto.randomBytes(12).toString('hex') + ext;
    cb(null, name);
  }
});

export const upload = multer({
  storage,
  limits: { fileSize: MAX_MB * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (!ALLOWED.has(file.mimetype)) return cb(new Error('Недопустимый тип файла'));
    cb(null, true);
  }
});

export const UPLOAD_DIR_PATH = path.resolve(UPLOAD_DIR);