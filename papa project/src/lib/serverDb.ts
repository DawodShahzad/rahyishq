import fs from 'fs';
import path from 'path';
import initialDb from '@/data/db.json';
import {
  syncBatchToGitHub,
  isGitHubSyncConfigured,
  ExtraRepoFile,
} from '@/lib/githubSync';

export function getDbPath(): string | null {
  try {
    if (typeof process !== 'undefined' && typeof process.cwd === 'function') {
      return path.join(process.cwd(), 'src', 'data', 'db.json');
    }
  } catch {
    // Edge runtime safe
  }
  return null;
}

export function getServerDb() {
  try {
    const dbPath = getDbPath();
    if (dbPath && typeof fs !== 'undefined' && fs.existsSync && fs.existsSync(dbPath)) {
      const fileData = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(fileData);
    }
  } catch (err) {
    console.warn('[serverDb] Failed to read db.json from filesystem:', err);
  }
  return initialDb;
}

/**
 * Persists updates + optional uploaded media files to local disk (if writable)
 * and/or pushes everything in ONE single GitHub commit (for Cloudflare / production).
 */
export async function writeBatchServerDb(
  dataOrMutator: any,
  extraFiles: ExtraRepoFile[] = [],
  commitMessage = 'Update database'
): Promise<{ localWritten: boolean; githubResult: any }> {
  let localWritten = false;

  // 1. Local filesystem write attempt (active on localhost / local node dev)
  try {
    const dbPath = getDbPath();
    if (dbPath && typeof fs !== 'undefined' && typeof fs.writeFileSync === 'function') {
      const uploadsDir = path.join(/*turbopackIgnore: true*/ process.cwd(), 'public', 'uploads');
      for (const file of extraFiles) {
        const filename = path.basename(file.path);
        const absPath = path.join(/*turbopackIgnore: true*/ uploadsDir, filename);
        if (typeof fs.mkdirSync === 'function') {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }
        fs.writeFileSync(absPath, Buffer.from(file.contentBase64, 'base64'));
      }

      const current = getServerDb();
      const updated = typeof dataOrMutator === 'function' ? dataOrMutator(current) : dataOrMutator;
      fs.writeFileSync(dbPath, JSON.stringify(updated, null, 2), 'utf8');
      localWritten = true;
    }
  } catch (err) {
    // Expected in Cloudflare Pages / Edge serverless runtime where filesystem is read-only
    console.warn('[serverDb] Local write skipped (read-only environment):', err);
  }

  // 2. GitHub sync commit (single commit for db.json + all extraFiles)
  let githubResult: any = null;
  if (isGitHubSyncConfigured()) {
    githubResult = await syncBatchToGitHub(dataOrMutator, extraFiles, commitMessage);
  } else {
    githubResult = {
      success: false,
      error: 'GITHUB_TOKEN is not configured in Cloudflare Pages environment variables. Pushing to GitHub requires GITHUB_TOKEN.',
    };
  }

  return { localWritten, githubResult };
}

/**
 * Persists updates either to local db.json (if running on local Node)
 * and/or pushes directly to GitHub repository (for Cloudflare Pages / production).
 */
export async function writeServerDb(
  dataOrMutator: any,
  commitMessage = 'Update database'
): Promise<{ localWritten: boolean; githubResult: any }> {
  return writeBatchServerDb(dataOrMutator, [], commitMessage);
}
