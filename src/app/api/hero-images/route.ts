import { NextResponse } from 'next/server';
import { HeroImage } from '@/types';
import { getServerDb, writeServerDb } from '@/lib/serverDb';

function readDb() {
  return getServerDb();
}

export async function GET() {
  const db = readDb();
  return NextResponse.json(db.heroImages || []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, title, mediaType, audioUrl } = body;

    if (!url || !url.trim()) {
      return NextResponse.json({ error: 'Hero Media Link (URL or file) is required.' }, { status: 400 });
    }

    const trimmedUrl = url.trim();
    const isVideo = mediaType === 'video' || Boolean(trimmedUrl.match(/\.(mp4|webm|mov|ogg)(\?.*)?$/i)) || trimmedUrl.startsWith('data:video/');

    const newHero: HeroImage = {
      id: `hero-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url: trimmedUrl,
      mediaType: isVideo ? 'video' : 'image',
      title: title ? title.trim() : '',
      audioUrl: audioUrl ? audioUrl.trim() : undefined,
      dateAdded: new Date().toISOString().split('T')[0],
    };

    const syncRes = await writeServerDb((currentDb: any) => {
      currentDb.heroImages = currentDb.heroImages || [];
      currentDb.heroImages.unshift(newHero);
      return currentDb;
    }, `feat: add hero media [${newHero.title || newHero.id}] via Mobile Admin`);

    const isSynced = Boolean(syncRes.githubResult?.success);
    const githubError = syncRes.githubResult?.error;

    return NextResponse.json({
      success: true,
      heroImage: newHero,
      syncedToGitHub: isSynced,
      commitSha: syncRes.githubResult?.commitSha,
      githubError: isSynced ? undefined : githubError,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Hero ID is required' }, { status: 400 });
    }

    const syncRes = await writeServerDb((currentDb: any) => {
      if (currentDb.heroImages) {
        currentDb.heroImages = currentDb.heroImages.filter((h: HeroImage) => h.id !== id);
      }
      return currentDb;
    }, `feat: delete hero media [${id}] via Mobile Admin`);

    const isSynced = Boolean(syncRes.githubResult?.success);
    const githubError = syncRes.githubResult?.error;

    return NextResponse.json({
      success: true,
      message: 'Hero media deleted',
      syncedToGitHub: isSynced,
      githubError: isSynced ? undefined : githubError,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
