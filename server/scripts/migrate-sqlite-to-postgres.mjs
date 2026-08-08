// ─── SQLite → PostgreSQL data migration ─────────────────────────────────────
// Copies application data from the legacy local SQLite database into the
// PostgreSQL database pointed to by DATABASE_URL. Designed for the Render
// deploy: run ONCE against the new (empty) Postgres database after
// `prisma migrate deploy`.
//
// Safety guarantees:
//   • The SQLite file is opened READ-ONLY — it is never modified.
//   • Admin.passwordHash is NEVER read, so no password can leak or be
//     overwritten. The default admin is created by server/prisma/seed.js
//     using DEFAULT_ADMIN_PASSWORD (set it in Render's env).
//   • AppSetting values that look secret (token/password/key/secret) are
//     copied as empty and reported, never written to Postgres.
//   • Every write is an upsert keyed by the record's unique id, so the
//     script is idempotent and safe to re-run.
//
// Usage:  DATABASE_URL=<postgres-url> node server/scripts/migrate-sqlite-to-postgres.mjs
//         (add --dry-run to preview without writing)
import 'dotenv/config';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const DRY_RUN = process.argv.includes('--dry-run');
const SQLITE_PATH = path.resolve(process.env.SQLITE_PATH || 'data/darul.sqlite');

const prisma = new PrismaClient();

// ─── value coercion: SQLite stores dates as epoch-ms and booleans as 0/1 ───
function toDate(v) {
  if (v === null || v === undefined) return null;
  if (typeof v === 'number') return new Date(v);
  if (typeof v === 'string' && /^\d+$/.test(v)) return new Date(Number(v));
  return v;
}

function toBool(v) {
  return v === 1 || v === true;
}

// Denylist for settings that could hold credentials — never copy their value.
const SECRET_KEY = /(^|_)(secret|token|password|passwd|apikey|api_key|key)(_|$)/i;

async function ensurePostgres() {
  try {
    const [row] = await prisma.$queryRaw`SELECT current_database() AS db`;
    return row.db;
  } catch (err) {
    throw new Error(
      `DATABASE_URL must point to PostgreSQL to run this migration (got: ${process.env.DATABASE_URL || 'unset'}). ` +
        `Details: ${err.message}`
    );
  }
}

async function upsertRows(model, rows, whereKey, transform) {
  const label = model;
  if (DRY_RUN) {
    console.log(`  ℹ [dry-run] ${label}: ${rows.length} row(s) would be copied`);
    return;
  }
  let copied = 0;
  for (const row of rows) {
    const data = transform(row);
    await prisma[model].upsert({ where: whereKey(row), update: data, create: data });
    copied++;
  }
  console.log(`  ✔ ${label}: ${copied} row(s) upserted`);
}

async function main() {
  const dbName = await ensurePostgres();
  console.log(`Target database: ${dbName}`);
  if (DRY_RUN) console.log('Running in DRY-RUN mode — nothing will be written.');

  const db = new DatabaseSync(SQLITE_PATH, { readOnly: true });
  console.log(`Reading (read-only): ${SQLITE_PATH}`);

  const counts = {};

  // ── Admin: deliberately skipped (see header comment) ─────────────────────
  const adminCount = db.prepare('SELECT COUNT(*) AS n FROM Admin').get().n;
  console.log(`  ℹ Admin: ${adminCount} row(s) skipped — seed.js creates the default admin (password from DEFAULT_ADMIN_PASSWORD).`);

  // ── AppSetting ───────────────────────────────────────────────────────────
  const settings = db.prepare('SELECT settingKey, settingValue, settingType, changedBy, previousValue, description, updatedAt FROM AppSetting').all();
  let secretSettings = 0;
  counts.AppSetting = await upsertRows(
    'AppSetting',
    settings,
    (r) => ({ settingKey: r.settingKey }),
    (r) => {
      const isSecret = SECRET_KEY.test(r.settingKey);
      if (isSecret) {
        secretSettings++;
        console.log(`  ℹ ${r.settingKey}: looks like a secret — value NOT copied`);
      }
      return {
        settingKey: r.settingKey,
        settingValue: isSecret ? null : r.settingValue,
        settingType: r.settingType ?? 'text',
        changedBy: r.changedBy,
        previousValue: r.previousValue,
        description: r.description,
        updatedAt: toDate(r.updatedAt),
      };
    }
  );
  if (secretSettings) console.log(`  ℹ ${secretSettings} secret-like setting(s) left empty (set them again via the Dev panel).`);

  // ── Category ─────────────────────────────────────────────────────────────
  const categories = db.prepare('SELECT id, name, type, sortOrder, createdAt FROM Category ORDER BY sortOrder').all();
  counts.Category = await upsertRows(
    'Category',
    categories,
    (r) => ({ name_type: { name: r.name, type: r.type } }),
    (r) => ({
      id: r.id,
      name: r.name,
      type: r.type,
      sortOrder: r.sortOrder ?? 0,
      createdAt: toDate(r.createdAt),
    })
  );

  // ── Book ─────────────────────────────────────────────────────────────────
  const books = db.prepare('SELECT id, title, author, category, description, coverImage, pagesCount, language, pdfUrl, isFeatured, rating, status, createdDate, updatedDate FROM Book').all();
  counts.Book = await upsertRows(
    'Book',
    books,
    (r) => ({ id: r.id }),
    (r) => ({
      id: r.id,
      title: r.title,
      author: r.author,
      category: r.category,
      description: r.description,
      coverImage: r.coverImage,
      pagesCount: r.pagesCount,
      language: r.language ?? 'العربية',
      pdfUrl: r.pdfUrl,
      isFeatured: toBool(r.isFeatured),
      rating: r.rating ?? 0,
      status: r.status ?? 'published',
      createdDate: toDate(r.createdDate),
      updatedDate: toDate(r.updatedDate),
    })
  );

  // ── VideoChannel ─────────────────────────────────────────────────────────
  const channels = db.prepare('SELECT id, name, channelLogo, description, youtubeUrl, category, sortOrder, visible, createdDate, updatedDate FROM VideoChannel ORDER BY sortOrder').all();
  counts.VideoChannel = await upsertRows(
    'VideoChannel',
    channels,
    (r) => ({ id: r.id }),
    (r) => ({
      id: r.id,
      name: r.name,
      channelLogo: r.channelLogo,
      description: r.description,
      youtubeUrl: r.youtubeUrl,
      category: r.category ?? 'عام',
      sortOrder: r.sortOrder ?? 0,
      visible: toBool(r.visible),
      createdDate: toDate(r.createdDate),
      updatedDate: toDate(r.updatedDate),
    })
  );

  // ── Video (after channels so channelId references exist) ────────────────
  const videos = db.prepare('SELECT id, title, description, youtubeUrl, videoUrl, channelId, channelName, category, thumbnail, duration, isFeatured, visible, sortOrder, createdDate, updatedDate FROM Video ORDER BY sortOrder').all();
  counts.Video = await upsertRows(
    'Video',
    videos,
    (r) => ({ id: r.id }),
    (r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      youtubeUrl: r.youtubeUrl,
      videoUrl: r.videoUrl,
      channelId: r.channelId,
      channelName: r.channelName,
      category: r.category ?? 'عام',
      thumbnail: r.thumbnail,
      duration: r.duration,
      isFeatured: toBool(r.isFeatured),
      visible: toBool(r.visible),
      sortOrder: r.sortOrder ?? 0,
      createdDate: toDate(r.createdDate),
      updatedDate: toDate(r.updatedDate),
    })
  );

  // ── SocialChannel ────────────────────────────────────────────────────────
  const socials = db.prepare('SELECT id, name, channelType, url, iconUrl, description, sortOrder, visible, createdDate, updatedDate FROM SocialChannel ORDER BY sortOrder').all();
  counts.SocialChannel = await upsertRows(
    'SocialChannel',
    socials,
    (r) => ({ id: r.id }),
    (r) => ({
      id: r.id,
      name: r.name,
      channelType: r.channelType,
      url: r.url,
      iconUrl: r.iconUrl,
      description: r.description,
      sortOrder: r.sortOrder ?? 0,
      visible: toBool(r.visible),
      createdDate: toDate(r.createdDate),
      updatedDate: toDate(r.updatedDate),
    })
  );

  // ── ContactMessage ───────────────────────────────────────────────────────
  const messages = db.prepare('SELECT id, name, email, message, read, createdAt FROM ContactMessage').all();
  counts.ContactMessage = await upsertRows(
    'ContactMessage',
    messages,
    (r) => ({ id: r.id }),
    (r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      message: r.message,
      read: toBool(r.read),
      createdAt: toDate(r.createdAt),
    })
  );

  db.close();
  console.log(DRY_RUN
    ? 'Done (dry-run). Run without --dry-run to copy data into PostgreSQL.'
    : 'Migration complete. Your SQLite file was NOT modified.');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e.message || e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
