import { Router } from 'express';
import { upload, forceKind, validateUploadedFile, publicUrlFor, VALID_KINDS } from '../middleware/upload.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// POST /api/upload  (admin only) — generic upload, auto-detects book/video/image by mimetype.
// Returns { file_url } to match the shape the frontend already expects.
router.post('/', requireAdmin, upload.single('file'), validateUploadedFile, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file', message: 'لم يتم إرسال أي ملف' });
  res.status(201).json({ file_url: publicUrlFor(req, req.file.path), file_name: req.file.originalname, size: req.file.size });
});

// POST /api/upload/:kind — force a destination folder regardless of mimetype.
router.post('/:kind', requireAdmin, (req, res, next) => {
  const { kind } = req.params;
  if (!VALID_KINDS.includes(kind)) {
    return res.status(400).json({ error: 'invalid_kind', message: `نوع الرفع غير مدعوم: ${kind}` });
  }
  try {
    forceKind(kind)(req, res, next);
  } catch (err) {
    return res.status(400).json({ error: 'invalid_kind', message: err.message });
  }
}, upload.single('file'), validateUploadedFile, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file', message: 'لم يتم إرسال أي ملف' });
  res.status(201).json({ file_url: publicUrlFor(req, req.file.path), file_name: req.file.originalname, size: req.file.size });
});

export default router;
