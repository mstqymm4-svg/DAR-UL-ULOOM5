import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';

const router = Router();

const toApi = (row) => ({
  id: row.id,
  name: row.name,
  type: row.type,
  sort_order: row.sortOrder,
});

// GET /api/categories?type=book|video
router.get('/', async (req, res) => {
  const where = req.query.type ? { type: req.query.type } : {};
  const rows = await prisma.category.findMany({ where, orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }] });
  res.json(rows.map(toApi));
});

router.post('/', requireAdmin, async (req, res) => {
  const { name, type, sort_order } = req.body || {};
  if (!name || !['book', 'video'].includes(type)) {
    return res.status(400).json({ error: 'validation_error', message: 'اسم التصنيف ونوعه (book أو video) مطلوبان' });
  }
  try {
    const row = await prisma.category.create({ data: { name, type, sortOrder: sort_order ?? 0 } });
    res.status(201).json(toApi(row));
  } catch (err) {
    res.status(409).json({ error: 'duplicate', message: 'هذا التصنيف موجود بالفعل' });
  }
});

router.put('/:id', requireAdmin, async (req, res) => {
  const { name, sort_order } = req.body || {};
  try {
    const row = await prisma.category.update({
      where: { id: req.params.id },
      data: { ...(name !== undefined && { name }), ...(sort_order !== undefined && { sortOrder: sort_order }) },
    });
    res.json(toApi(row));
  } catch (err) {
    res.status(404).json({ error: 'not_found', message: 'التصنيف غير موجود' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: 'not_found', message: 'التصنيف غير موجود' });
  }
});

export default router;
