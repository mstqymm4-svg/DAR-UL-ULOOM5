import fs from 'fs';
import path from 'path';

const root = process.cwd();
const dirs = [
  path.join(root, 'data'),
  path.join(root, 'server', 'uploads', 'books'),
  path.join(root, 'server', 'uploads', 'covers'),
  path.join(root, 'server', 'uploads', 'videos'),
  path.join(root, 'server', 'uploads', 'thumbnails'),
  path.join(root, 'server', 'uploads', 'images'),
  path.join(root, 'server', 'uploads', 'misc'),
];
for (const dir of dirs) fs.mkdirSync(dir, { recursive: true });
console.log('✔ Local persistent storage folders are ready');
