// ─── Upload backfill ────────────────────────────────────────────────────────
// Ensures every file referenced by the database actually lives inside the
// current uploads directory (UPLOADS_DIR, default server/uploads), copying
// files from a previous/legacy location when needed and rewriting absolute
// URLs to the canonical /uploads/... form.
//
// Use cases:
//   • Changing UPLOADS_DIR on an existing deployment (e.g. moving uploads to a
//     persistent volume): files are copied from the old folder into the new one.
//   • Files were stored on a host that served them under a different origin:
//     absolute URLs (http://host:4000/uploads/...) are rewritten to relative.
//
// It is read-only on the database except for rewriting the file URLs that were
// actually copied. Running it when everything is already correct is a no-op.
//
// Usage:  DATABASE_URL=<postgres-url> node server/scripts/backfill-uploads.mjs
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { UPLOADS_ROOT } from '../src/middleware/upload.js';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

// Legacy location uploads were historically stored in (kept around so the
// backfill can pull from it even after a UPLOADS_DIR change).
const LEGACY_UPLOADS = path.resolve(process.cwd(), 'server', 'uploads');

function normalizeUrl(url) {
  if (!url || typeof url !== 'string') return null;
  if (url.startsWith('/uploads/')) return url.slice('/uploads/'.length);
  const m = url.match(/^https?:\/\/[^/]+\/uploads\/(.+)$/i);
  if (m) return m[1];
  return null; // external URL (YouTube, data URI, etc.) — leave untouched
}

function ensureLocalFile(relative) {
  const dest = path.join(UPLOADS_ROOT, relative);
  const src = path.join(LEGACY_UPLOADS, relative);

  if (fs.existsSync(dest)) {
    // already in place
    const ok = fs.statSync(dest).size > 0;
    return { dest, copied: false, ok };
  }
  if (fs.existsSync(src)) {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    return { dest, copied: true, ok: fs.statSync(dest).size > 0 };
  }
  return { dest, copied: false, ok: false };
}

function report(url) {
  const rel = normalizeUrl(url);
  if (!rel) return null; // not a local upload
  const { dest, copied, ok } = ensureLocalFile(rel);
  if (!ok) return { warning: `referenced file missing everywhere: ${url}` };
  return { newUrl: `/uploads/${rel.split(path.sep).join('/')}`, copied };
}

async function rewriteUrl(model, id, field, url) {
  const r = report(url);
  if (!r) return { changed: false };
  if (r.warning) return { changed: false, warning: r.warning };
  if (r.newUrl !== url) {
    if (!DRY_RUN) {
      const data = {};
      data[field] = r.newUrl;
      await prisma[model].update({ where: { id }, data });
    }
    return { changed: true, copied: r.copied };
  }
  return { changed: false };
}

async function main() {
  const stats = { checked: 0, rewritten: 0, copied: 0, warnings: 0 };

  const rows = [
    ...(await prisma.book.findMany({ select: { id: true, pdfUrl: true, coverImage: true } })),
  ].flatMap((b) => [
    { model: 'book', id: b.id, field: 'pdfUrl', url: b.pdfUrl },
    { model: 'book', id: b.id, field: 'coverImage', url: b.coverImage },
  ]);
  const videos = await prisma.video.findMany({ select: { id: true, videoUrl: true, thumbnail: true } });
  for (const v of videos) {
    rows.push({ model: 'video', id: v.id, field: 'videoUrl', url: v.videoUrl });
    rows.push({ model: 'video', id: v.id, field: 'thumbnail', url: v.thumbnail });
  }
  const channels = await prisma.videoChannel.findMany({ select: { id: true, channelLogo: true } });
  for (const c of channels) rows.push({ model: 'videoChannel', id: c.id, field: 'channelLogo', url: c.channelLogo });
  const socials = await prisma.socialChannel.findMany({ select: { id: true, iconUrl: true } });
  for (const s of socials) rows.push({ model: 'socialChannel', id: s.id, field: 'iconUrl', url: s.iconUrl });

  for (const r of rows) {
    const res = await rewriteUrl(r.model, r.id, r.field, r.url);
    stats.checked++;
    if (res.changed) {
      stats.rewritten++;
      if (res.copied) stats.copied++;
    }
    if (res.warning) {
      stats.warnings++;
      console.log(`  ⚠ ${res.warning}`);
    }
  }

  console.log(`Checked ${stats.checked} file reference(s).`);
  console.log(`Rewritten ${stats.rewritten}, copied ${stats.copied}, warnings ${stats.warnings}.`);
  if (DRY_RUN) console.log('Dry-run — no files were copied and no URLs were updated.');
  else console.log(`Uploads live at: ${UPLOADS_ROOT}`);
}

main()
  .catch((e) => {
    console.error('Backfill failed:', e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
