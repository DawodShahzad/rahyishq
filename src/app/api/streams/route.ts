import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { StreamItem } from '@/types';
import { syncDbToGitHub, isGitHubSyncConfigured } from '@/lib/githubSync';

const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');

function readDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading db.json:', err);
  }
  return { streams: [], images: [], audioTracks: [] };
}

async function writeDb(data: any, commitMessage = 'Update streams') {
  let localWritten = false;
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    localWritten = true;
  } catch (err) {
    console.warn('[Local DB] Streams write skipped or read-only (normal in serverless/Vercel):', err);
  }

  let githubResult: any = null;
  if (isGitHubSyncConfigured()) {
    githubResult = await syncDbToGitHub(data, commitMessage);
  }

  return { localWritten, githubResult };
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
      description: description ? description.trim() : '',
      createdAt: new Date().toISOString().split('T')[0],
    };

    const db = readDb();
    if (!db.streams) db.streams = [];
    db.streams.push(newStream);
    const syncRes = await writeDb(db, `feat: add stream [${newStream.title}] via Mobile Admin`);

    return NextResponse.json({ 
      success: true, 
      stream: newStream,
      syncedToGitHub: Boolean(syncRes.githubResult?.success),
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

    const db = readDb();
    if (db.streams) {
      db.streams = db.streams.filter((s: StreamItem) => s.id !== id);
      const syncRes = await writeDb(db, `feat: delete stream [${id}] via Mobile Admin`);
      return NextResponse.json({ 
        success: true, 
        message: 'Stream deleted successfully',
        syncedToGitHub: Boolean(syncRes.githubResult?.success),
      });
    }

    return NextResponse.json({ success: true, message: 'Stream deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
