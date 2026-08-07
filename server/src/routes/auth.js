import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../db.js';
import { requireAdmin, signAdminToken } from '../middleware/auth.js';

const router = Router();

// POST /api/auth/login  { username?, password } -> { token, user }
// Single-admin app: username is optional and defaults to "admin".
router.post('/login', async (req, res) => {
  const { username, password } = req.body || {};
  const name = (username || 'admin').trim();
  if (!password) {
    return res.status(400).json({ error: 'validation_error', message: 'كلمة المرور مطلوبة' });
  }

  const admin = await prisma.admin.findUnique({ where: { username: name } });
  if (!admin) {
    return res.status(401).json({ error: 'invalid_credentials', message: 'بيانات الدخول غير صحيحة' });
  }

  const ok = await bcrypt.compare(password, admin.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: 'invalid_credentials', message: 'بيانات الدخول غير صحيحة' });
  }

  const token = signAdminToken(admin);
  res.json({
    token,
    user: { id: admin.id, username: admin.username, full_name: admin.fullName, role: 'admin' },
  });
});

// GET /api/auth/me — returns the current admin, or 401 if not logged in.
router.get('/me', requireAdmin, async (req, res) => {
  const admin = await prisma.admin.findUnique({ where: { id: req.admin.sub } });
  if (!admin) return res.status(401).json({ error: 'auth_required' });
  res.json({ id: admin.id, username: admin.username, full_name: admin.fullName, role: 'admin' });
});

// PUT /api/auth/me — update the admin's display name / password.
router.put('/me', requireAdmin, async (req, res) => {
  const { full_name, current_password, new_password } = req.body || {};
  const admin = await prisma.admin.findUnique({ where: { id: req.admin.sub } });
  if (!admin) return res.status(401).json({ error: 'auth_required' });

  const data = {};
  if (full_name !== undefined) data.fullName = full_name;

  if (new_password) {
    if (!current_password) {
      return res.status(400).json({ error: 'validation_error', message: 'أدخل كلمة المرور الحالية لتغييرها' });
    }
    const ok = await bcrypt.compare(current_password, admin.passwordHash);
    if (!ok) {
      return res.status(401).json({ error: 'invalid_credentials', message: 'كلمة المرور الحالية غير صحيحة' });
    }
    data.passwordHash = await bcrypt.hash(new_password, 10);
  }

  const updated = await prisma.admin.update({ where: { id: admin.id }, data });
  res.json({ id: updated.id, username: updated.username, full_name: updated.fullName, role: 'admin' });
});

// POST /api/auth/logout — stateless JWT, nothing to invalidate server-side.
// Kept for API-shape compatibility with the old client.
router.post('/logout', (req, res) => {
  res.json({ success: true });
});

export default router;
