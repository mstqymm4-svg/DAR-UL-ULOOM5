import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { toApiRow, fromApiBody, parseListParams, parseEqualityFilters } from '../lib/mapping.js';

const router = Router();

const FIELD_MAP = {
  name: 'name',
  channel_type: 'channelType',
  url: 'url',
  icon_url: 'iconUrl',
  description: 'description',
  sort_order: 'sortOrder',
  visible: 'visible',
  created_date: 'createdDate',
  updated_date: 'updatedDate',
};

const toApi = (row) => toApiRow(row, FIELD_MAP);

router.get('/', async (req, res) => {
  const { orderBy, take } = parseListParams(req.query, FIELD_MAP, 'sortOrder');
  const where = parseEqualityFilters(req.query, FIELD_MAP);
  const rows = await prisma.socialChannel.findMany({ where, orderBy, take });
  res.json(rows.map(toApi));
});

router.post('/', requireAdmin, async (req, res) => {
  const { name, channel_type, url } = req.body || {};
  if (!name || !channel_type || !url) {
    return res.status(400).json({ error: 'validation_error', message: 'اسم القناة ونوعها ورابطها مطلوبة' });
  }
  const data = fromApiBody(req.body, FIELD_MAP);
  const row = await prisma.socialChannel.create({ data });
  res.status(201).json(toApi(row));
});

router.put('/:id', requireAdmin, async (req, res) => {
  const data = fromApiBody(req.body, FIELD_MAP);
  try {
    const row = await prisma.socialChannel.update({ where: { id: req.params.id }, data });
    res.json(toApi(row));
  } catch (err) {
    res.status(404).json({ error: 'not_found', message: 'القناة غير موجودة' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.socialChannel.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: 'not_found', message: 'القناة غير موجودة' });
  }
});

export default router;
