import { Router } from 'express';
import { prisma } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { toApiRow, fromApiBody, parseListParams, parseEqualityFilters } from '../lib/mapping.js';

const router = Router();

// API (snake_case) <-> Prisma (camelCase) field map
const FIELD_MAP = {
  title: 'title',
  author: 'author',
  category: 'category',
  description: 'description',
  cover_image: 'coverImage',
  pages_count: 'pagesCount',
  language: 'language',
  pdf_url: 'pdfUrl',
  is_featured: 'isFeatured',
  rating: 'rating',
  status: 'status',
  created_date: 'createdDate',
  updated_date: 'updatedDate',
};

const toApi = (row) => toApiRow(row, FIELD_MAP);

// GET /api/books  — list + optional equality filters + sort + limit
router.get('/', async (req, res) => {
  const { orderBy, take } = parseListParams(req.query, FIELD_MAP);
  const where = parseEqualityFilters(req.query, FIELD_MAP);
  const books = await prisma.book.findMany({ where, orderBy, take });
  res.json(books.map(toApi));
});

// GET /api/books/:id
router.get('/:id', async (req, res) => {
  const book = await prisma.book.findUnique({ where: { id: req.params.id } });
  if (!book) return res.status(404).json({ error: 'not_found', message: 'الكتاب غير موجود' });
  res.json(toApi(book));
});

// POST /api/books  (admin only)
router.post('/', requireAdmin, async (req, res) => {
  const { title, author, category } = req.body || {};
  if (!title || !author || !category) {
    return res.status(400).json({ error: 'validation_error', message: 'عنوان الكتاب والمؤلف والتصنيف مطلوبة' });
  }
  const data = fromApiBody(req.body, FIELD_MAP);
  const book = await prisma.book.create({ data });
  res.status(201).json(toApi(book));
});

// PUT /api/books/:id  (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  const data = fromApiBody(req.body, FIELD_MAP);
  try {
    const book = await prisma.book.update({ where: { id: req.params.id }, data });
    res.json(toApi(book));
  } catch (err) {
    res.status(404).json({ error: 'not_found', message: 'الكتاب غير موجود' });
  }
});

// DELETE /api/books/:id  (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    await prisma.book.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: 'not_found', message: 'الكتاب غير موجود' });
  }
});

export default router;
