import jwt from 'jsonwebtoken';

// In production a real JWT_SECRET must be provided via the environment
// (fail-fast, see index.js). The dev fallback is ONLY for local development.
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-me';

export function signAdminToken(admin) {
  return jwt.sign(
    { sub: admin.id, username: admin.username, role: 'admin' },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Requires a valid admin JWT (Authorization: Bearer <token>).
// All write operations (create/update/delete) go through this.
export function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'auth_required', message: 'يجب تسجيل الدخول كمدير للقيام بهذا الإجراء' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.admin = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'invalid_token', message: 'جلسة الدخول غير صالحة أو منتهية' });
  }
}

// Attaches req.admin if a valid token is present, but never blocks the request.
// Useful for read routes whose response can optionally vary for admins.
export function attachAdminIfPresent(req, _res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (token) {
    try {
      req.admin = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      // ignore invalid token on optional routes
    }
  }
  next();
}
