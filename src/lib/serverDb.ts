import fs from 'fs';
import path from 'path';
import initialDb from '@/data/db.json';
import { syncDbToGitHub, isGitHubSyncConfigured } from '@/lib/githubSync';

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
 * Persists updates either to local db.json (if running on local Node)
 * and/or pushes directly to GitHub repository (for Cloudflare Pages / production).
 */
export async function writeServerDb(
  dataOrMutator: any,
  commitMessage = 'Update database'
): Promise<{ localWritten: boolean; githubResult: any }> {
  let localWritten = false;

  // 1. Local filesystem write attempt (active on localhost / local node dev)
  try {
    const dbPath = getDbPath();
    if (dbPath && typeof fs !== 'undefined' && typeof fs.writeFileSync === 'function') {
      const current = getServerDb();
      const updated = typeof dataOrMutator === 'function' ? dataOrMutator(current) : dataOrMutator;
      fs.writeFileSync(dbPath, JSON.stringify(updated, null, 2), 'utf8');
      localWritten = true;
    }
  } catch (err) {
    // Expected in Cloudflare Pages / Edge serverless runtime where filesystem is read-only
    console.warn('[serverDb] Local write skipped (read-only environment):', err);
  }

  // 2. GitHub sync commit (for live Cloudflare Pages deployment)
  let githubResult: any = null;
  if (isGitHubSyncConfigured()) {
    githubResult = await syncDbToGitHub(dataOrMutator, commitMessage);
  } else {
    githubResult = {
      success: false,
      error: 'GITHUB_TOKEN is not configured in Cloudflare Pages environment variables. Pushing to GitHub requires GITHUB_TOKEN.',
    };
  }

  return { localWritten, githubResult };
}
