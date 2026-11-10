/**
 * GitHub API Auto-Commit Sync Engine
 *
 * Enables direct mobile / web publishing without touching a PC or running git commands.
 * Supports single-commit batch syncing of `src/data/db.json` plus any newly uploaded
 * media files (via GitHub Git Data API) so multiple admin edits and image uploads
 * trigger only ONE GitHub commit and ONE Cloudflare build.
 */

export interface ExtraRepoFile {
  path: string;
  contentBase64: string;
}

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

function buildGitHubHeaders(token: string, hasBody = false): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'Rahy-Ishq-Cloudflare-Admin',
  };
  if (hasBody) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

function formatGitHubAuthError(status: number): GitHubCommitResponse | null {
  if (status === 401) {
    return {
      success: false,
      error: 'GitHub Token Authentication Failed (401 Bad Credentials). Please ensure your GITHUB_TOKEN is valid and has not expired.',
    };
  }
  if (status === 403) {
    return {
      success: false,
      error: 'GitHub Permission Denied (403 Forbidden). Ensure your GitHub Personal Access Token has "Contents: Read and write" (for fine-grained tokens) or "repo" scope (for classic tokens).',
    };
  }
  return null;
}

/**
 * Commits `src/data/db.json` and optional extra files in ONE single GitHub commit.
 * Uses the Contents API for single-file small updates and the Git Data API (blobs/tree/commit)
 * when extra files or large JSON payloads are present.
 */
export async function syncBatchToGitHub(
  dataOrMutator: any,
  extraFiles: ExtraRepoFile[] = [],
  commitMessage = 'Update database'
): Promise<GitHubCommitResponse> {
  const config = getGitHubConfig();

  if (!config.token) {
    const errorMsg = 'GITHUB_TOKEN is not configured in environment variables. Please add GITHUB_TOKEN in Cloudflare Pages Settings -> Environment Variables.';
    console.warn('[GitHub Sync]', errorMsg);
    return { success: false, error: errorMsg };
  }

  const fileApiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}?ref=${config.branch}`;
  const repoApiBase = `https://api.github.com/repos/${config.owner}/${config.repo}`;

  async function fetchLiveDb(): Promise<{
    currentSha?: string;
    liveDb: any;
    errorResult?: GitHubCommitResponse;
  }> {
    const getRes = await fetch(fileApiUrl, {
      method: 'GET',
      headers: buildGitHubHeaders(config.token),
      cache: 'no-store',
    });

    const authErr = formatGitHubAuthError(getRes.status);
    if (authErr) return { liveDb: null, errorResult: authErr };

    if (getRes.ok) {
      const fileInfo = await getRes.json();
      let liveDb: any = null;
      if (fileInfo.content) {
        try {
          liveDb = JSON.parse(fromBase64Utf8(fileInfo.content));
        } catch (parseErr) {
          console.warn('[GitHub Sync] Could not parse existing GitHub db.json, using fallback:', parseErr);
        }
      } else if (fileInfo.sha && fileInfo.git_url) {
        // Large files (>1MB) omit content in Contents API; fetch blob directly
        const blobRes = await fetch(fileInfo.git_url, {
          method: 'GET',
          headers: buildGitHubHeaders(config.token),
          cache: 'no-store',
        });
        if (blobRes.ok) {
          const blobData = await blobRes.json();
          if (blobData.content) {
            try {
              liveDb = JSON.parse(fromBase64Utf8(blobData.content));
            } catch {}
          }
        }
      }
      return { currentSha: fileInfo.sha, liveDb };
    }

    if (getRes.status === 404) {
      return { currentSha: undefined, liveDb: null };
    }

    const errData = await getRes.json().catch(() => ({}));
    return {
      liveDb: null,
      errorResult: {
        success: false,
        error: errData.message || `GitHub API error (${getRes.status}) while checking repository.`,
      },
    };
  }

  function buildFinalDb(liveDb: any) {
    if (typeof dataOrMutator === 'function') {
      return dataOrMutator(liveDb || {});
    }
    if (liveDb && typeof dataOrMutator === 'object') {
      return { ...liveDb, ...dataOrMutator };
    }
    return dataOrMutator;
  }

  async function commitViaGitTree(jsonString: string, retryCount = 0): Promise<GitHubCommitResponse> {
    // 1. Get branch ref
    const refRes = await fetch(`${repoApiBase}/git/ref/heads/${config.branch}`, {
      method: 'GET',
      headers: buildGitHubHeaders(config.token),
      cache: 'no-store',
    });
    const refAuthErr = formatGitHubAuthError(refRes.status);
    if (refAuthErr) return refAuthErr;
    if (!refRes.ok) {
      const errData = await refRes.json().catch(() => ({}));
      return { success: false, error: errData.message || `Failed to read branch ref (${refRes.status}).` };
    }
    const refData = await refRes.json();
    const latestCommitSha: string = refData.object.sha;

    // 2. Get base commit to retrieve base tree SHA
    const commitRes = await fetch(`${repoApiBase}/git/commits/${latestCommitSha}`, {
      method: 'GET',
      headers: buildGitHubHeaders(config.token),
      cache: 'no-store',
    });
    if (!commitRes.ok) {
      const errData = await commitRes.json().catch(() => ({}));
      return { success: false, error: errData.message || `Failed to read base commit (${commitRes.status}).` };
    }
    const commitData = await commitRes.json();
    const baseTreeSha: string = commitData.tree.sha;

    // 3. Create blobs for all extra files + db.json
    const treeItems: Array<{ path: string; mode: '100644'; type: 'blob'; sha: string }> = [];

    for (const file of extraFiles) {
      const cleanPath = file.path.replace(/^\/+/, '');
      const blobRes = await fetch(`${repoApiBase}/git/blobs`, {
        method: 'POST',
        headers: buildGitHubHeaders(config.token, true),
        body: JSON.stringify({
          content: file.contentBase64,
          encoding: 'base64',
        }),
      });
      if (!blobRes.ok) {
        const errData = await blobRes.json().catch(() => ({}));
        return {
          success: false,
          error: errData.message || `Failed to upload file blob ${cleanPath} (${blobRes.status}).`,
        };
      }
      const blobJson = await blobRes.json();
      treeItems.push({
        path: cleanPath,
        mode: '100644',
        type: 'blob',
        sha: blobJson.sha,
      });
    }

    const dbBlobRes = await fetch(`${repoApiBase}/git/blobs`, {
      method: 'POST',
      headers: buildGitHubHeaders(config.token, true),
      body: JSON.stringify({
        content: toBase64Utf8(jsonString),
        encoding: 'base64',
      }),
    });
    if (!dbBlobRes.ok) {
      const errData = await dbBlobRes.json().catch(() => ({}));
      return {
        success: false,
        error: errData.message || `Failed to create db.json blob (${dbBlobRes.status}).`,
      };
    }
    const dbBlobJson = await dbBlobRes.json();
    treeItems.push({
      path: config.filePath,
      mode: '100644',
      type: 'blob',
      sha: dbBlobJson.sha,
    });

    // 4. Create new Git tree
    const treeRes = await fetch(`${repoApiBase}/git/trees`, {
      method: 'POST',
      headers: buildGitHubHeaders(config.token, true),
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems,
      }),
    });
    if (!treeRes.ok) {
      const errData = await treeRes.json().catch(() => ({}));
      return {
        success: false,
        error: errData.message || `Failed to create Git tree (${treeRes.status}).`,
      };
    }
    const treeJson = await treeRes.json();

    // 5. Create single commit
    const newCommitRes = await fetch(`${repoApiBase}/git/commits`, {
      method: 'POST',
      headers: buildGitHubHeaders(config.token, true),
      body: JSON.stringify({
        message: commitMessage,
        tree: treeJson.sha,
        parents: [latestCommitSha],
        committer: {
          name: 'Rahy Ishq Cloud Admin',
          email: 'admin@rahyishq.org',
        },
      }),
    });
    if (!newCommitRes.ok) {
      const errData = await newCommitRes.json().catch(() => ({}));
      return {
        success: false,
        error: errData.message || `Failed to create Git commit (${newCommitRes.status}).`,
      };
    }
    const newCommitJson = await newCommitRes.json();

    // 6. Update branch ref
    const patchRefRes = await fetch(`${repoApiBase}/git/refs/heads/${config.branch}`, {
      method: 'PATCH',
      headers: buildGitHubHeaders(config.token, true),
      body: JSON.stringify({
        sha: newCommitJson.sha,
        force: false,
      }),
    });

    if (patchRefRes.ok) {
      const commitSha = newCommitJson.sha || '';
      const commitUrl = newCommitJson.html_url || `https://github.com/${config.owner}/${config.repo}/commit/${commitSha}`;
      console.log(`[GitHub Sync] Batch committed (${treeItems.length} file(s)) to ${config.owner}/${config.repo}@${config.branch} (${commitSha.substring(0, 7)})`);
      return {
        success: true,
        commitSha,
        commitUrl,
      };
    }

    if ((patchRefRes.status === 409 || patchRefRes.status === 422) && retryCount === 0) {
      console.warn('[GitHub Sync] Branch ref moved during batch commit. Retrying once...');
      const refreshed = await fetchLiveDb();
      if (refreshed.errorResult) return refreshed.errorResult;
      const nextJson = JSON.stringify(buildFinalDb(refreshed.liveDb), null, 2);
      return commitViaGitTree(nextJson, retryCount + 1);
    }

    const errData = await patchRefRes.json().catch(() => ({}));
    return {
      success: false,
      error: errData.message || `Failed to update branch ref (${patchRefRes.status}).`,
    };
  }

  async function attemptCommit(retryCount = 0): Promise<GitHubCommitResponse> {
    try {
      const { currentSha, liveDb, errorResult } = await fetchLiveDb();
      if (errorResult) return errorResult;

      const finalDb = buildFinalDb(liveDb);
      const jsonString = JSON.stringify(finalDb, null, 2);

      // Use Git Data API if we have uploaded media files OR if db.json is large
      if (extraFiles.length > 0 || jsonString.length > 850_000) {
        return await commitViaGitTree(jsonString, retryCount);
      }

      // Fast path for db.json-only update
      const base64Content = toBase64Utf8(jsonString);
      const putRes = await fetch(`${repoApiBase}/contents/${config.filePath}`, {
        method: 'PUT',
        headers: buildGitHubHeaders(config.token, true),
        body: JSON.stringify({
          message: commitMessage,
          content: base64Content,
          sha: currentSha,
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

      if (putRes.status === 409 && retryCount === 0) {
        console.warn('[GitHub Sync] 409 Conflict detected. Retrying with fresh SHA...');
        return attemptCommit(retryCount + 1);
      }

      const errResult = await putRes.json().catch(() => ({}));
      let msg = errResult.message || `GitHub API returned ${putRes.status}`;
      if (putRes.status === 422) {
        msg += ' (Payload may be too large or file exceeds GitHub API limit. Ensure images are hosted on 3rd party CDN or uploaded via batch upload).';
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

/**
 * Commits updated database JSON directly to GitHub repository via GitHub REST API.
 */
export async function syncDbToGitHub(
  dataOrMutator: any,
  commitMessage: string
): Promise<GitHubCommitResponse> {
  return syncBatchToGitHub(dataOrMutator, [], commitMessage);
}
