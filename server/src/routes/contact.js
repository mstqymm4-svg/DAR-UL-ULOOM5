import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

const toApi = (row) => ({
  id: row.id,
  name: row.name,
  email: row.email,
  message: row.message,
  read: row.read,
  created_date: row.createdAt.toISOString(),
});

// POST /api/contact — public: visitors submit the contact form.
// Messages are stored locally; no external email/AI service is used.
router.post('/', async (req, res) => {
  const { name, email, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'validation_error', message: 'الاسم والبريد الإلكتروني والرسالة مطلوبة' });
  }
  const row = await prisma.contactMessage.create({ data: { name, email, message } });
  res.status(201).json(toApi(row));
});

// GET /api/contact — admin only: view submitted messages.
router.get('/', requireAdmin, async (req, res) => {
  const rows = await prisma.contactMessage.findMany({ orderBy: { createdAt: 'desc' } });
  res.json(rows.map(toApi));
});

router.put('/:id/read', requireAdmin, async (req, res) => {
  try {
    const row = await prisma.contactMessage.update({ where: { id: req.params.id }, data: { read: true } });
    res.json(toApi(row));
  } catch (err) {
    res.status(404).json({ error: 'not_found', message: 'الرسالة غير موجودة' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.contactMessage.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: 'not_found', message: 'الرسالة غير موجودة' });
  }
});

export default router;
