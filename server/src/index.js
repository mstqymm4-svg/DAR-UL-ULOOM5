import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { UPLOADS_ROOT } from './middleware/upload.js';

import authRoutes from './routes/auth.js';
import bookRoutes from './routes/books.js';
import videoRoutes from './routes/videos.js';
import videoChannelRoutes from './routes/videoChannels.js';
import socialChannelRoutes from './routes/socialChannels.js';
import categoryRoutes from './routes/categories.js';
import settingsRoutes from './routes/settings.js';
import searchRoutes from './routes/search.js';
import contactRoutes from './routes/contact.js';
import uploadRoutes from './routes/upload.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Static file serving for uploaded books/videos/covers/thumbnails/images
app.use('/uploads', express.static(UPLOADS_ROOT));

// ─── API routes ─────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/video-channels', videoChannelRoutes);
app.use('/api/social-channels', socialChannelRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/upload', uploadRoutes);

app.get('/api/health', (req, res) => res.json({ ok: true }));

// ─── Serve the built frontend in production ────────────────────────────
// (npm run build outputs to ../dist — see vite.config.js)
const distDir = path.join(__dirname, '..', '..', 'dist');
app.use(express.static(distDir));
app.get(/^(?!\/api\/|\/uploads\/).*/, (req, res, next) => {
  res.sendFile(path.join(distDir, 'index.html'), (err) => {
    if (err) next();
  });
});

// ─── Error handler ───────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  console.error(err);
  if (err?.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'file_too_large', message: 'حجم الملف أكبر من الحد المسموح' });
  }
  res.status(err.status || 500).json({ error: 'server_error', message: err.message || 'حدث خطأ في الخادم' });
});

// IMPORTANT: bind to 0.0.0.0, not just "localhost" — cloud hosts like Render
// route external traffic to 0.0.0.0. process.env.PORT is provided by the
// host at runtime (Render sets it automatically); 4000 is only a local
// development fallback.
const PORT = process.env.PORT || 4000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✔ Dar Al Uloom API server running on port ${PORT}`);
});
