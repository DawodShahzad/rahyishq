import { NextResponse } from 'next/server';
import { StreamItem } from '@/types';
import { getServerDb, writeServerDb } from '@/lib/serverDb';

function readDb() {
  return getServerDb();
}

export async function GET() {
  const db = readDb();
  return NextResponse.json(db.streams || []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, description } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Stream title is required.' }, { status: 400 });
    }

    const trimmedTitle = title.trim();
    const slug = trimmedTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `stream-${Date.now()}`;

    const newStream: StreamItem = {
      id: `stream-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: trimmedTitle,
      slug,
      description: description ? description.trim() : undefined,
      createdAt: new Date().toISOString(),
    };

    const syncRes = await writeServerDb((currentDb: any) => {
      currentDb.streams = currentDb.streams || [];
      currentDb.streams.push(newStream);
      return currentDb;
    }, `feat: add stream [${newStream.title}] via Mobile Admin`);

    const isSynced = Boolean(syncRes.githubResult?.success);
    const githubError = syncRes.githubResult?.error;

    return NextResponse.json({
      success: true,
      stream: newStream,
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
      return NextResponse.json({ error: 'Stream ID is required' }, { status: 400 });
    }

    const syncRes = await writeServerDb((currentDb: any) => {
      if (currentDb.streams) {
        currentDb.streams = currentDb.streams.filter((s: StreamItem) => s.id !== id);
      }
      return currentDb;
    }, `feat: delete stream [${id}] via Mobile Admin`);

    const isSynced = Boolean(syncRes.githubResult?.success);
    const githubError = syncRes.githubResult?.error;

    return NextResponse.json({
      success: true,
      message: 'Stream deleted',
      syncedToGitHub: isSynced,
      githubError: isSynced ? undefined : githubError,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
