import { Router } from 'express';
import { upload, forceKind, publicUrlFor } from '../middleware/upload.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

// POST /api/upload  (admin only) — generic upload, auto-detects book/video/image by mimetype.
// Returns { file_url } to match the shape the frontend already expects.
router.post('/', requireAdmin, upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file', message: 'لم يتم إرسال أي ملف' });
  res.status(201).json({ file_url: publicUrlFor(req, req.file.path), file_name: req.file.originalname, size: req.file.size });
});

// POST /api/upload/cover — force destination folder regardless of mimetype
router.post('/cover', requireAdmin, forceKind('cover'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file', message: 'لم يتم إرسال أي ملف' });
  res.status(201).json({ file_url: publicUrlFor(req, req.file.path) });
});

router.post('/thumbnail', requireAdmin, forceKind('thumbnail'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file', message: 'لم يتم إرسال أي ملف' });
  res.status(201).json({ file_url: publicUrlFor(req, req.file.path) });
});

router.post('/book', requireAdmin, forceKind('book'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file', message: 'لم يتم إرسال أي ملف' });
  res.status(201).json({ file_url: publicUrlFor(req, req.file.path) });
});

router.post('/video', requireAdmin, forceKind('video'), upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'no_file', message: 'لم يتم إرسال أي ملف' });
  res.status(201).json({ file_url: publicUrlFor(req, req.file.path) });
});

export default router;
