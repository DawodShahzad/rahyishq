import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { HeroImage } from '@/types';

const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');

function readDb() {
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading db.json in hero-images API:', err);
  }
  return { streams: [], images: [], audioTracks: [], heroImages: [] };
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
      title: title ? title.trim() : 'Makalat-E-Hikmat Hero',
      audioUrl: audioUrl && audioUrl.trim() ? audioUrl.trim() : undefined,
      dateAdded: new Date().toISOString().split('T')[0],
    };

    const db = readDb();
    if (!db.heroImages) db.heroImages = [];
    db.heroImages.unshift(newHero);
    writeDb(db);

    return NextResponse.json({ success: true, heroImage: newHero }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Hero Image ID is required' }, { status: 400 });
    }

    const db = readDb();
    if (db.heroImages) {
      db.heroImages = db.heroImages.filter((h: HeroImage) => h.id !== id);
      writeDb(db);
    }

    return NextResponse.json({ success: true, message: 'Hero image deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
