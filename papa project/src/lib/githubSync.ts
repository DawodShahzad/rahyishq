/**
 * GitHub API Auto-Commit Sync Engine
 * 
 * Enables direct mobile / web publishing without touching a PC or running git commands.
 * When changes are made in the admin panel on the live website (Vercel), this module
 * automatically commits the updated db.json directly to your GitHub repository,
 * which in turn triggers Vercel to rebuild and deploy live.
 */

interface GitHubCommitResponse {
  success: boolean;
  commitSha?: string;
  commitUrl?: string;
  error?: string;
}

export function isGitHubSyncConfigured(): boolean {
  return Boolean(process.env.GITHUB_TOKEN);
}

export function getGitHubConfig() {
  return {
    owner: process.env.GITHUB_OWNER || 'DawodShahzad',
    repo: process.env.GITHUB_REPO || 'rahyishq',
    branch: process.env.GITHUB_BRANCH || 'main',
    token: process.env.GITHUB_TOKEN || '',
    filePath: 'src/data/db.json',
  };
}

/**
 * Commits updated database JSON directly to GitHub repository via GitHub REST API.
 */
export async function syncDbToGitHub(
  updatedDbData: any,
  commitMessage: string
): Promise<GitHubCommitResponse> {
  const config = getGitHubConfig();

  if (!config.token) {
    console.warn('[GitHub Sync] GITHUB_TOKEN not configured. Skipping GitHub commit.');
    return { success: false, error: 'GITHUB_TOKEN not configured.' };
  }

  const fileApiUrl = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}?ref=${config.branch}`;

  try {
    // 1. Fetch current file to get its existing SHA
    const getRes = await fetch(fileApiUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'User-Agent': 'Dar-ul-Ehsan-Mobile-Admin',
      },
      cache: 'no-store',
    });

    let currentSha: string | undefined = undefined;

    if (getRes.ok) {
      const existingFileInfo = await getRes.json();
      currentSha = existingFileInfo.sha;
    } else if (getRes.status !== 404) {
      const errData = await getRes.json().catch(() => ({}));
      console.error('[GitHub Sync] Error fetching file info:', errData);
      return { 
        success: false, 
        error: errData.message || `GitHub API error (${getRes.status}) while checking file.` 
      };
    }

    // 2. Prepare JSON string and encode in Base64 (UTF-8 safe for Urdu/Arabic text)
    const jsonString = JSON.stringify(updatedDbData, null, 2);
    const base64Content = Buffer.from(jsonString, 'utf-8').toString('base64');

    // 3. Commit file via PUT request to GitHub
    const putRes = await fetch(`https://api.github.com/repos/${config.owner}/${config.repo}/contents/${config.filePath}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${config.token}`,
        Accept: 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'Dar-ul-Ehsan-Mobile-Admin',
      },
      body: JSON.stringify({
        message: commitMessage,
        content: base64Content,
        sha: currentSha, // Required by GitHub if file already exists
        branch: config.branch,
        committer: {
          name: 'Mobile Admin Bot',
          email: 'admin@darulehsan.local',
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
    } else {
      const errResult = await putRes.json().catch(() => ({}));
      console.error('[GitHub Sync] Failed to commit to GitHub:', errResult);
      return {
        success: false,
        error: errResult.message || `GitHub API returned ${putRes.status}`,
      };
    }
  } catch (err: any) {
    console.error('[GitHub Sync] Network error connecting to GitHub API:', err);
    return {
      success: false,
      error: err.message || 'Network error connecting to GitHub.',
    };
  }
}
