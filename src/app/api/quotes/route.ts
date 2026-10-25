import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { INITIAL_QUOTES } from '@/data/initialData';
import { QuoteItem } from '@/types';

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
  return { quotes: INITIAL_QUOTES, gallery: [] };
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
  return NextResponse.json(db.quotes || INITIAL_QUOTES);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { urdu, english, category, volume, number, theme, author } = body;

    if (!urdu || !english) {
      return NextResponse.json(
        { error: 'Urdu text and English translation are required.' },
        { status: 400 }
      );
    }

    const newQuote: QuoteItem = {
      id: `quote-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      urdu: urdu.trim(),
      english: english.trim(),
      category: category || 'makalat',
      volume: volume ? volume.trim() : 'Makalat-e-Hikmat',
      number: number ? number.toString().trim() : undefined,
      theme: theme ? theme.trim() : 'Divine Wisdom',
      author: author ? author.trim() : 'Hazrat Sufi Muhammad Barkat Ali (R.A.)',
      dateAdded: new Date().toISOString().split('T')[0],
      isFeatured: Boolean(body.isFeatured),
    };

    const db = readDb();
    if (!db.quotes) db.quotes = [...INITIAL_QUOTES];
    db.quotes.unshift(newQuote);
    writeDb(db);

    return NextResponse.json({ success: true, quote: newQuote }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }

    const db = readDb();
    if (db.quotes) {
      db.quotes = db.quotes.filter((q: QuoteItem) => q.id !== id);
      writeDb(db);
    }

    return NextResponse.json({ success: true, message: 'Quote removed' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
