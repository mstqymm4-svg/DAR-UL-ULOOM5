import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Uploads root is configurable so production deployments can point it at a
// persistent volume (Render mounts its disk at <project>/server/uploads by
// default via render.yaml — no env needed). Falls back to ./server/uploads.
export function resolveUploadsRoot() {
  const envDir = process.env.UPLOADS_DIR;
  if (envDir) return path.resolve(process.cwd(), envDir);
  return path.join(__dirname, '..', '..', 'uploads');
}
export const UPLOADS_ROOT = resolveUploadsRoot();

const DIR_BY_KIND = {
  book: 'books',
  cover: 'covers',
  video: 'videos',
  thumbnail: 'thumbnails',
  image: 'images',
  misc: 'misc',
};

export const VALID_KINDS = Object.keys(DIR_BY_KIND);

// Ensure every upload folder exists on boot.
Object.values(DIR_BY_KIND).forEach((dir) => {
  fs.mkdirSync(path.join(UPLOADS_ROOT, dir), { recursive: true });
});

// ─── Allowed file profiles per upload kind ──────────────────────────────────
// Each entry: accepted mime prefixes, accepted extensions, and a magic-byte
// validator (first bytes of the file) so a file cannot be smuggled in with a
// spoofed extension/mimetype.
function hexAt(buf, offset, length) {
  return buf.toString('hex', offset, offset + length);
}

const PDF_MAGIC = (buf) => buf.toString('latin1', 0, 4) === '%PDF';

const IMAGE_MAGIC = (buf) => {
  if (hexAt(buf, 0, 3) === 'ffd8ff') return 'image/jpeg'; // JPG
  if (hexAt(buf, 0, 8) === '89504e470d0a1a0a') return 'image/png';
  if (buf.toString('latin1', 0, 4) === 'RIFF' && buf.toString('latin1', 8, 12) === 'WEBP') return 'image/webp';
  if (['GIF87a', 'GIF89a'].includes(buf.toString('latin1', 0, 6))) return 'image/gif';
  return null;
};

const VIDEO_MAGIC = (buf) => {
  if (hexAt(buf, 4, 4) === 'ftyp') return 'video/mp4'; // MP4 / MOV (ISO BMFF)
  if (hexAt(buf, 0, 4) === '1a45dfa3') return 'video/webm'; // EBML (webm)
  if (buf.toString('latin1', 0, 4) === 'OggS') return 'video/ogg';
  return null;
};

const FONT_MAGIC = (buf) => {
  if (hexAt(buf, 0, 4) === '00010000') return 'font/ttf';
  if (buf.toString('latin1', 0, 4) === 'OTTO') return 'font/otf';
  if (buf.toString('latin1', 0, 4) === 'wOFF') return 'font/woff';
  if (buf.toString('latin1', 0, 4) === 'wOF2') return 'font/woff2';
  return null;
};

const KIND_PROFILES = {
  book: {
    mimes: ['application/pdf', 'application/x-pdf', 'application/octet-stream'],
    exts: ['.pdf'],
    magic: PDF_MAGIC,
    detect: PDF_MAGIC,
  },
  cover: {
    mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    exts: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    magic: IMAGE_MAGIC,
    detect: IMAGE_MAGIC,
  },
  thumbnail: {
    mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    exts: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    magic: IMAGE_MAGIC,
    detect: IMAGE_MAGIC,
  },
  image: {
    mimes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    exts: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
    magic: IMAGE_MAGIC,
    detect: IMAGE_MAGIC,
  },
  video: {
    mimes: ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime'],
    exts: ['.mp4', '.m4v', '.webm', '.ogv', '.ogg', '.mov'],
    magic: VIDEO_MAGIC,
    detect: VIDEO_MAGIC,
  },
  misc: {
    // misc accepts PDFs, images, videos AND fonts (the Dev panel uploads
    // custom font files through the generic endpoint).
    mimes: [
      'application/pdf', 'application/x-pdf', 'application/octet-stream',
      'image/jpeg', 'image/png', 'image/webp', 'image/gif',
      'video/mp4', 'video/webm', 'video/ogg', 'video/quicktime',
      'font/ttf', 'font/otf', 'font/woff', 'font/woff2',
      'application/x-font-ttf', 'application/x-font-opentype', 'application/vnd.ms-opentype',
    ],
    exts: [
      '.pdf',
      '.jpg', '.jpeg', '.png', '.webp', '.gif',
      '.mp4', '.m4v', '.webm', '.ogv', '.ogg', '.mov',
      '.ttf', '.otf', '.woff', '.woff2',
    ],
    magic: (buf) => PDF_MAGIC(buf) || IMAGE_MAGIC(buf) || VIDEO_MAGIC(buf) || FONT_MAGIC(buf),
    detect: (buf) => PDF_MAGIC(buf) || IMAGE_MAGIC(buf) || VIDEO_MAGIC(buf) || FONT_MAGIC(buf),
  },
};

// Fallback mimetype (application/octet-stream) → detect by extension.
function mimeFromExt(fileName) {
  const ext = (path.extname(fileName) || '').toLowerCase();
  if (ext === '.pdf') return 'application/pdf';
  if (['.jpg', '.jpeg'].includes(ext)) return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  if (ext === '.gif') return 'image/gif';
  if (ext === '.mp4' || ext === '.m4v') return 'video/mp4';
  if (ext === '.webm') return 'video/webm';
  if (ext === '.ogg' || ext === '.ogv') return 'video/ogg';
  if (ext === '.mov') return 'video/quicktime';
  if (ext === '.ttf') return 'font/ttf';
  if (ext === '.otf') return 'font/otf';
  if (ext === '.woff') return 'font/woff';
  if (ext === '.woff2') return 'font/woff2';
  return null;
}

// What kind does this file belong to? Mirrors the previous auto-detection but
// also falls back to the file extension when the mimetype is missing/spoofed.
function detectKind(file) {
  const rawMime = (file.mimetype || '').toLowerCase();
  const mime = rawMime === 'application/octet-stream' || !rawMime
    ? mimeFromExt(file.originalname)
    : rawMime;
  if (mime === 'application/pdf' || mime === 'application/x-pdf') return 'book';
  if (mime && mime.startsWith('video/')) return 'video';
  if (mime && mime.startsWith('image/')) return 'image';
  if (mime && (mime.startsWith('font/') || mime.includes('opentype'))) return 'misc';
  return 'misc';
}

function resolveKind(req, file) {
  return req.uploadKind || detectKind(file);
}

// Multer storage — generated filenames only (never user-controlled), so there
// is no path-traversal surface. Each kind maps to its own subfolder.
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const kind = resolveKind(req, file);
    const dir = DIR_BY_KIND[kind] || DIR_BY_KIND.misc;
    cb(null, path.join(UPLOADS_ROOT, dir));
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase().replace(/[^.a-z0-9]/g, '');
    const unique = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    cb(null, unique);
  },
});

const maxMb = Number(process.env.MAX_UPLOAD_MB || 500);

export const upload = multer({
  storage,
  limits: { fileSize: maxMb * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const kind = resolveKind(req, file);
    const profile = KIND_PROFILES[kind] || KIND_PROFILES.misc;
    const ext = (path.extname(file.originalname || '') || '').toLowerCase();
    const mime = (file.mimetype || '').toLowerCase();

    const mimeOk = profile.mimes.includes(mime)
      || (mime === 'application/octet-stream' && extOk); // unknown mimetype: trust extension, magic bytes still checked after upload
    const extOk = profile.exts.includes(ext);

    if (!mimeOk || !extOk) {
      const err = new Error(`نوع الملف غير مدعوم (${kind})`);
      err.status = 400;
      err.code = 'INVALID_FILE_TYPE';
      return cb(err);
    }
    cb(null, true);
  },
});

// Middleware factory to force a specific upload sub-folder regardless of mimetype.
export function forceKind(kind) {
  if (!VALID_KINDS.includes(kind)) {
    throw new Error(`Unsupported upload kind: ${kind}`);
  }
  return (req, _res, next) => {
    req.uploadKind = kind;
    next();
  };
}

// Post-upload validation: confirms the stored bytes match the expected magic
// header for the resolved kind, so a renamed/spoofed file is rejected and
// removed instead of being served. Runs after multer has written the file.
export function validateUploadedFile(req, res, next) {
  const file = req.file;
  if (!file) return next();
  try {
    const buf = fs.readFileSync(file.path);
    const kind = resolveKind(req, file);
    const profile = KIND_PROFILES[kind] || KIND_PROFILES.misc;
    const detected = profile.magic(buf);
    if (!detected) {
      fs.unlink(file.path, () => {});
      const err = new Error('محتوى الملف لا يطابق نوعه المعلن');
      err.status = 400;
      err.code = 'INVALID_FILE_CONTENT';
      return next(err);
    }
    next();
  } catch (err) {
    fs.unlink(file.path, () => {});
    const wrapped = new Error('تعذر التحقق من الملف');
    wrapped.status = 400;
    next(wrapped);
  }
}

export function publicUrlFor(req, absoluteFilePath) {
  const relative = path.relative(UPLOADS_ROOT, absoluteFilePath).split(path.sep).join('/');
  return `/uploads/${relative}`;
}
