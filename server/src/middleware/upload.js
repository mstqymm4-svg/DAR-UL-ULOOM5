import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const UPLOADS_ROOT = path.join(__dirname, '..', '..', 'uploads');

const DIR_BY_KIND = {
  book: 'books',
  cover: 'covers',
  video: 'videos',
  thumbnail: 'thumbnails',
  image: 'images',
  misc: 'misc',
};

// Ensure every upload folder exists on boot.
Object.values(DIR_BY_KIND).forEach((dir) => {
  fs.mkdirSync(path.join(UPLOADS_ROOT, dir), { recursive: true });
});

function detectKind(file) {
  const mime = file.mimetype || '';
  if (mime === 'application/pdf') return 'book';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('image/')) return 'image';
  return 'misc';
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Allow the route to force a specific subfolder (e.g. cover vs generic image)
    const kind = req.uploadKind || detectKind(file);
    const dir = DIR_BY_KIND[kind] || DIR_BY_KIND.misc;
    cb(null, path.join(UPLOADS_ROOT, dir));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '') || '';
    const safeExt = ext.replace(/[^.a-zA-Z0-9]/g, '');
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${safeExt}`;
    cb(null, unique);
  },
});

const maxMb = Number(process.env.MAX_UPLOAD_MB || 500);

export const upload = multer({
  storage,
  limits: { fileSize: maxMb * 1024 * 1024 },
});

// Middleware factory to force a specific upload sub-folder regardless of mimetype,
// e.g. app.post('/x', forceKind('cover'), upload.single('file'), handler)
export function forceKind(kind) {
  return (req, _res, next) => {
    req.uploadKind = kind;
    next();
  };
}

export function publicUrlFor(req, absoluteFilePath) {
  const relative = path.relative(UPLOADS_ROOT, absoluteFilePath).split(path.sep).join('/');
  return `/uploads/${relative}`;
}
