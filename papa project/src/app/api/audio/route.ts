import { NextResponse } from 'next/server';
import { AudioTrack } from '@/types';
import { getServerDb, writeServerDb } from '@/lib/serverDb';

function readDb() {
  return getServerDb();
}

export async function GET() {
  const db = readDb();
  return NextResponse.json(db.audioTracks || []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, url, artist, duration } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Audio title is required' }, { status: 400 });
    }

    if (!url || !url.trim()) {
      return NextResponse.json({ error: 'Audio URL or direct link is required' }, { status: 400 });
    }

    const newTrack: AudioTrack = {
      id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      url: url.trim(),
      artist: artist ? artist.trim() : 'Dar-ul-Ehsan Ambient',
      duration: duration || '0:30',
      dateAdded: new Date().toISOString().split('T')[0],
    };

    const syncRes = await writeServerDb((currentDb: any) => {
      currentDb.audioTracks = currentDb.audioTracks || [];
      currentDb.audioTracks.unshift(newTrack);
      return currentDb;
    }, `feat: add audio track [${newTrack.title}] via Mobile Admin`);

    const isSynced = Boolean(syncRes.githubResult?.success);
    const githubError = syncRes.githubResult?.error;

    return NextResponse.json({
      success: true,
      track: newTrack,
      syncedToGitHub: isSynced,
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
      return NextResponse.json({ error: 'Track ID is required' }, { status: 400 });
    }

    const syncRes = await writeServerDb((currentDb: any) => {
      if (currentDb.audioTracks) {
        currentDb.audioTracks = currentDb.audioTracks.filter((t: AudioTrack) => t.id !== id);
      }
      return currentDb;
    }, `feat: delete audio track [${id}] via Mobile Admin`);

    const isSynced = Boolean(syncRes.githubResult?.success);
    const githubError = syncRes.githubResult?.error;

    return NextResponse.json({
      success: true,
      message: 'Audio track deleted',
      syncedToGitHub: isSynced,
      githubError: isSynced ? undefined : githubError,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
