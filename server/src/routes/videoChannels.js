import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { toApiRow, fromApiBody, parseListParams, parseEqualityFilters } from '../lib/mapping.js';

const router = Router();

const FIELD_MAP = {
  name: 'name',
  channel_logo: 'channelLogo',
  description: 'description',
  youtube_url: 'youtubeUrl',
  category: 'category',
  sort_order: 'sortOrder',
  visible: 'visible',
  created_date: 'createdDate',
  updated_date: 'updatedDate',
};

const toApi = (row) => toApiRow(row, FIELD_MAP);

router.get('/', async (req, res) => {
  const { orderBy, take } = parseListParams(req.query, FIELD_MAP, 'sortOrder');
  const where = parseEqualityFilters(req.query, FIELD_MAP);
  const rows = await prisma.videoChannel.findMany({ where, orderBy, take });
  res.json(rows.map(toApi));
});

router.get('/:id', async (req, res) => {
  const row = await prisma.videoChannel.findUnique({ where: { id: req.params.id } });
  if (!row) return res.status(404).json({ error: 'not_found', message: 'القناة غير موجودة' });
  res.json(toApi(row));
});

router.post('/', requireAdmin, async (req, res) => {
  if (!req.body?.name) return res.status(400).json({ error: 'validation_error', message: 'اسم القناة مطلوب' });
  const data = fromApiBody(req.body, FIELD_MAP);
  const row = await prisma.videoChannel.create({ data });
  res.status(201).json(toApi(row));
});

router.put('/:id', requireAdmin, async (req, res) => {
  const data = fromApiBody(req.body, FIELD_MAP);
  try {
    const row = await prisma.videoChannel.update({ where: { id: req.params.id }, data });
    res.json(toApi(row));
  } catch (err) {
    res.status(404).json({ error: 'not_found', message: 'القناة غير موجودة' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.videoChannel.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: 'not_found', message: 'القناة غير موجودة' });
  }
});

export default router;
