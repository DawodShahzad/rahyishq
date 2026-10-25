import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { INITIAL_GALLERY } from '@/data/initialData';
import { GalleryImage } from '@/types';

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
  return { quotes: [], gallery: INITIAL_GALLERY };
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
  return NextResponse.json(db.gallery || INITIAL_GALLERY);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url, title, category, description, location, year } = body;

    if (!url || !title) {
      return NextResponse.json(
        { error: 'Image Direct URL and Title are required.' },
        { status: 400 }
      );
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format. Please provide a full direct image URL (e.g. https://...)' },
        { status: 400 }
      );
    }

    const newImage: GalleryImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      url: url.trim(),
      title: title.trim(),
      category: category || 'dar-ul-ehsan',
      description: description ? description.trim() : '',
      location: location ? location.trim() : undefined,
      year: year ? year.toString().trim() : undefined,
      dateAdded: new Date().toISOString().split('T')[0],
      isFeatured: Boolean(body.isFeatured),
    };

    const db = readDb();
    if (!db.gallery) db.gallery = [...INITIAL_GALLERY];
    db.gallery.unshift(newImage);
    writeDb(db);

    return NextResponse.json({ success: true, image: newImage }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const db = readDb();
    if (db.gallery) {
      db.gallery = db.gallery.filter((img: GalleryImage) => img.id !== id);
      writeDb(db);
    }

    return NextResponse.json({ success: true, message: 'Image removed successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
