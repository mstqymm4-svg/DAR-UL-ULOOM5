import { Router } from 'express';
import { prisma } from '../db.js';

const router = Router();

// GET /api/search?q=...&type=books|videos|all
// Simple, fully-local keyword search (title/author/description/category).
// No external AI/LLM service involved.
router.get('/', async (req, res) => {
  const q = (req.query.q || '').trim();
  const type = req.query.type || 'all';

  if (!q) return res.json({ books: [], videos: [] });

  const result = { books: [], videos: [] };

  if (type === 'all' || type === 'books') {
    result.books = await prisma.book.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { author: { contains: q } },
          { description: { contains: q } },
          { category: { contains: q } },
        ],
      },
      take: 100,
    });
  }

  if (type === 'all' || type === 'videos') {
    result.videos = await prisma.video.findMany({
      where: {
        OR: [
          { title: { contains: q } },
          { description: { contains: q } },
          { category: { contains: q } },
          { channelName: { contains: q } },
        ],
      },
      take: 100,
    });
  }

  res.json(result);
});

export default router;
