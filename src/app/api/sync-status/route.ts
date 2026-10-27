import { NextResponse } from 'next/server';
import { isGitHubSyncConfigured, getGitHubConfig } from '@/lib/githubSync';

export async function GET() {
  const isConfigured = isGitHubSyncConfigured();
  const config = getGitHubConfig();

  return NextResponse.json({
    isConfigured,
    owner: config.owner,
    repo: config.repo,
    branch: config.branch,
  });
}
