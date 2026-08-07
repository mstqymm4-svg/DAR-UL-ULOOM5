import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { toApiRow, fromApiBody, parseListParams, parseEqualityFilters } from '../lib/mapping.js';

const router = Router();

const FIELD_MAP = {
  setting_key: 'settingKey',
  setting_value: 'settingValue',
  setting_type: 'settingType',
  changed_by: 'changedBy',
  previous_value: 'previousValue',
  description: 'description',
  updated_date: 'updatedAt',
};

const toApi = (row) => toApiRow(row, FIELD_MAP, ['updatedAt']);

// GET /api/settings  — list all, or filter by ?setting_key=xxx
router.get('/', async (req, res) => {
  const { orderBy, take } = parseListParams(req.query, FIELD_MAP, 'updatedAt');
  const where = parseEqualityFilters(req.query, FIELD_MAP);
  const rows = await prisma.appSetting.findMany({ where, orderBy, take });
  res.json(rows.map(toApi));
});

// Convenience: GET /api/settings/by-key/:key -> single value or null
router.get('/by-key/:key', async (req, res) => {
  const row = await prisma.appSetting.findUnique({ where: { settingKey: req.params.key } });
  res.json(row ? toApi(row) : null);
});

router.post('/', requireAdmin, async (req, res) => {
  if (!req.body?.setting_key) {
    return res.status(400).json({ error: 'validation_error', message: 'مفتاح الإعداد مطلوب' });
  }
  const data = fromApiBody(req.body, FIELD_MAP);
  const row = await prisma.appSetting.upsert({
    where: { settingKey: req.body.setting_key },
    update: data,
    create: data,
  });
  res.status(201).json(toApi(row));
});

router.put('/:id', requireAdmin, async (req, res) => {
  const data = fromApiBody(req.body, FIELD_MAP);
  try {
    const row = await prisma.appSetting.update({ where: { id: req.params.id }, data });
    res.json(toApi(row));
  } catch (err) {
    res.status(404).json({ error: 'not_found', message: 'الإعداد غير موجود' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.appSetting.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: 'not_found', message: 'الإعداد غير موجود' });
  }
});

export default router;
