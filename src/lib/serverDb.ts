import fs from 'fs';
import path from 'path';
import initialDb from '@/data/db.json';

const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');

export function getServerDb() {
  try {
    if (typeof fs !== 'undefined' && fs.existsSync && fs.existsSync(dbPath)) {
      const fileData = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(fileData);
    }
  } catch (err) {
    console.warn('[serverDb] Failed to read db.json from filesystem:', err);
  }
  return initialDb;
}
