import fs from 'fs';
import path from 'path';

// Prepares local persistent storage folders. Honors UPLOADS_DIR when set so
// production deployments can point uploads at a persistent volume; defaults
// to server/uploads (Render mounts its disk there — see render.yaml).
const uploadsRoot = process.env.UPLOADS_DIR
  ? path.resolve(process.cwd(), process.env.UPLOADS_DIR)
  : path.join(process.cwd(), 'server', 'uploads');

const dirs = [
  path.join(process.cwd(), 'data'),
  path.join(uploadsRoot, 'books'),
  path.join(uploadsRoot, 'covers'),
  path.join(uploadsRoot, 'videos'),
  path.join(uploadsRoot, 'thumbnails'),
  path.join(uploadsRoot, 'images'),
  path.join(uploadsRoot, 'misc'),
];
for (const dir of dirs) fs.mkdirSync(dir, { recursive: true });
console.log('✔ Local persistent storage folders are ready');
