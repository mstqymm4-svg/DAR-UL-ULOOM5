import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { toApiRow, fromApiBody, parseListParams, parseEqualityFilters } from '../lib/mapping.js';

const router = Router();

const FIELD_MAP = {
  title: 'title',
  description: 'description',
  youtube_url: 'youtubeUrl',
  video_url: 'videoUrl',
  channel_id: 'channelId',
  channel_name: 'channelName',
  category: 'category',
  thumbnail: 'thumbnail',
  duration: 'duration',
  is_featured: 'isFeatured',
  visible: 'visible',
  sort_order: 'sortOrder',
  created_date: 'createdDate',
  updated_date: 'updatedDate',
};

const toApi = (row) => toApiRow(row, FIELD_MAP);

router.get('/', async (req, res) => {
  const { orderBy, take } = parseListParams(req.query, FIELD_MAP);
  const where = parseEqualityFilters(req.query, FIELD_MAP);
  const videos = await prisma.video.findMany({ where, orderBy, take });
  res.json(videos.map(toApi));
});

router.get('/:id', async (req, res) => {
  const video = await prisma.video.findUnique({ where: { id: req.params.id } });
  if (!video) return res.status(404).json({ error: 'not_found', message: 'الفيديو غير موجود' });
  res.json(toApi(video));
});

router.post('/', requireAdmin, async (req, res) => {
  const { title } = req.body || {};
  if (!title || (!req.body.youtube_url && !req.body.video_url)) {
    return res.status(400).json({ error: 'validation_error', message: 'عنوان الفيديو ورابط الفيديو مطلوبان' });
  }
  const data = fromApiBody(req.body, FIELD_MAP);
  const video = await prisma.video.create({ data });
  res.status(201).json(toApi(video));
});

router.put('/:id', requireAdmin, async (req, res) => {
  const data = fromApiBody(req.body, FIELD_MAP);
  try {
    const video = await prisma.video.update({ where: { id: req.params.id }, data });
    res.json(toApi(video));
  } catch (err) {
    res.status(404).json({ error: 'not_found', message: 'الفيديو غير موجود' });
  }
});

router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.video.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: 'not_found', message: 'الفيديو غير موجود' });
  }
});

export default router;
