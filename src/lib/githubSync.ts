/**
 * GitHub API Auto-Commit Sync Engine
 * 
 * Enables direct mobile / web publishing without touching a PC or running git commands.
 * When changes are made in the admin panel on the live website (Cloudflare Pages / Vercel),
 * this module automatically fetches the current live db.json from GitHub, applies the update,
 * and commits it directly to your GitHub repository.
 * This triggers Cloudflare Pages to rebuild and deploy live.
 */

interface GitHubCommitResponse {
  success: boolean;
  commitSha?: string;
  commitUrl?: string;
  error?: string;
}

export function isGitHubSyncConfigured(): boolean {
  const token = (process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '').trim();
  return Boolean(token);
}

export function getGitHubConfig() {
  const token = (process.env.GITHUB_TOKEN || process.env.GH_TOKEN || '').trim();
  return {
    owner: (process.env.GITHUB_OWNER || 'DawodShahzad').trim(),
    repo: (process.env.GITHUB_REPO || 'rahyishq').trim(),
    branch: (process.env.GITHUB_BRANCH || 'main').trim(),
    token,
    filePath: 'src/data/db.json',
  };
}

function toBase64Utf8(str: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(str, 'utf-8').toString('base64');
  }
  return btoa(unescape(encodeURIComponent(str)));
}

function fromBase64Utf8(b64: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(b64, 'base64').toString('utf-8');
  }
  return decodeURIComponent(escape(atob(b64.replace(/\s/g, ''))));
}

/**
 * Commits updated database JSON directly to GitHub repository via GitHub REST API.
 * Supports passing either an updated DB object OR an updater mutator function (currentDb) => newDb.
 * Fetching the current file from GitHub first guarantees we never overwrite newer commits
 * or lose images if the serverless runtime has older build-time data.
 */
export async function syncDbToGitHub(
  dataOrMutator: any,
  commitMessage: string
): Promise<GitHubCommitResponse> {
  const config = getGitHubConfig();

  if (!config.token) {
    const errorMsg = 'GITHUB_TOKEN is not configured in environment variables. Please add GITHUB_TOKEN in Cloudflare Pages Settings -> Environment Variables.';
    console.warn('[GitHub Sync]', errorMsg);
    return { success: false, error: errorMsg };
  }

  const fileApiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}?ref=${config.branch}`;

  // Helper for performing the fetch & commit
  async function attemptCommit(retryCount = 0): Promise<GitHubCommitResponse> {
    try {
      // 1. Fetch current file from GitHub to get latest SHA and remote content
      const getRes = await fetch(fileApiUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'Rahy-Ishq-Cloudflare-Admin',
        },
        cache: 'no-store',
      });

      let currentSha: string | undefined = undefined;
      let liveDb: any = null;

      if (getRes.ok) {
        const fileInfo = await getRes.json();
        currentSha = fileInfo.sha;
        if (fileInfo.content) {
          try {
            const rawDecoded = fromBase64Utf8(fileInfo.content);
            liveDb = JSON.parse(rawDecoded);
          } catch (parseErr) {
            console.warn('[GitHub Sync] Could not parse existing GitHub db.json, using fallback:', parseErr);
          }
        }
      } else if (getRes.status === 401) {
        return {
          success: false,
          error: 'GitHub Token Authentication Failed (401 Bad Credentials). Please ensure your GITHUB_TOKEN is valid and has not expired.',
        };
      } else if (getRes.status === 403) {
        return {
          success: false,
          error: 'GitHub Permission Denied (403 Forbidden). Ensure your GitHub Personal Access Token has "Contents: Read and write" (for fine-grained tokens) or "repo" scope (for classic tokens).',
        };
      } else if (getRes.status === 404) {
        // File does not exist yet or branch/repo not found
        currentSha = undefined;
      } else {
        const errData = await getRes.json().catch(() => ({}));
        return {
          success: false,
          error: errData.message || `GitHub API error (${getRes.status}) while checking repository.`,
        };
      }

      // 2. Prepare updated DB payload
      let finalDb: any;
      if (typeof dataOrMutator === 'function') {
        finalDb = dataOrMutator(liveDb || {});
      } else if (liveDb && typeof dataOrMutator === 'object') {
        // If dataOrMutator is an object, merge gracefully
        finalDb = { ...liveDb, ...dataOrMutator };
      } else {
        finalDb = dataOrMutator;
      }

      // 3. Encode in Base64 (UTF-8 safe for Urdu/Arabic text)
      const jsonString = JSON.stringify(finalDb, null, 2);
      const base64Content = toBase64Utf8(jsonString);

      // 4. Commit file via PUT request to GitHub
      const putRes = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${config.token}`,
          Accept: 'application/vnd.github.v3+json',
          'Content-Type': 'application/json',
          'User-Agent': 'Rahy-Ishq-Cloudflare-Admin',
        },
        body: JSON.stringify({
          message: commitMessage,
          content: base64Content,
          sha: currentSha, // Required by GitHub if file exists
          branch: config.branch,
          committer: {
            name: 'Rahy Ishq Cloud Admin',
            email: 'admin@rahyishq.org',
          },
        }),
      });

      if (putRes.ok) {
        const result = await putRes.json();
        const commitSha = result.commit?.sha || '';
        const commitUrl = result.commit?.html_url || '';
        console.log(`[GitHub Sync] Successfully committed to ${config.owner}/${config.repo}@${config.branch} (${commitSha.substring(0, 7)})`);
        return {
          success: true,
          commitSha,
          commitUrl,
        };
      }

      // If conflict (409) occurs due to another commit occurring concurrently, retry once
      if (putRes.status === 409 && retryCount === 0) {
        console.warn('[GitHub Sync] 409 Conflict detected. Retrying with fresh SHA...');
        return attemptCommit(retryCount + 1);
      }

      const errResult = await putRes.json().catch(() => ({}));
      let msg = errResult.message || `GitHub API returned ${putRes.status}`;
      if (putRes.status === 422) {
        msg += ' (Payload may be too large or file exceeds GitHub API limit. Ensure images are hosted on 3rd party CDN rather than as large Base64 strings).';
      }
      return {
        success: false,
        error: msg,
      };
    } catch (err: any) {
      console.error('[GitHub Sync] Network error connecting to GitHub API:', err);
      return {
        success: false,
        error: err.message || 'Network error connecting to GitHub API.',
      };
    }
  }

  return attemptCommit(0);
}
