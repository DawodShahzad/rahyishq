import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { AudioTrack } from '@/types';

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

function writeDb(data: any) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing to db.json:', err);
    return false;
  }
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
      return NextResponse.json({ error: 'Audio URL or local path (/music/...) is required' }, { status: 400 });
    }

    const newTrack: AudioTrack = {
      id: `track-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      title: title.trim(),
      url: url.trim(),
      artist: artist ? artist.trim() : 'Dar-ul-Ehsan Ambient',
      duration: duration || '0:30',
      dateAdded: new Date().toISOString().split('T')[0],
    };

    const db = readDb();
    if (!db.audioTracks) db.audioTracks = [];
    db.audioTracks.push(newTrack);
    writeDb(db);

    return NextResponse.json({ success: true, track: newTrack }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Audio Track ID is required' }, { status: 400 });
    }

    const db = readDb();
    if (db.audioTracks) {
      db.audioTracks = db.audioTracks.filter((t: AudioTrack) => t.id !== id);
      writeDb(db);
    }

    return NextResponse.json({ success: true, message: 'Audio track deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
