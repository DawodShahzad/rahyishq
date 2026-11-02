import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { FeedImage } from '@/types';
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

async function writeDb(data: any, commitMessage = 'Update images database') {
  let localWritten = false;
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    localWritten = true;
  } catch (err) {
    console.warn('[Local DB] Write skipped or read-only (normal in serverless/Vercel):', err);
  }

  let githubResult: any = null;
  if (isGitHubSyncConfigured()) {
    githubResult = await syncDbToGitHub(data, commitMessage);
  }

  return { localWritten, githubResult };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const streamId = searchParams.get('stream');
  const query = searchParams.get('q')?.toLowerCase().trim();
  const isAdmin = searchParams.get('admin') === 'true';
  const id = searchParams.get('id');

  const db = readDb();
  let images: FeedImage[] = db.images || [];

  if (id) {
    const single = images.find(img => img.id === id);
    if (!single) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }
    if (!isAdmin) {
      // Remove adminNotes for public requests
      const { adminNotes, ...publicSingle } = single;
      return NextResponse.json(publicSingle);
    }
    return NextResponse.json(single);
  }

  // Filter by stream
  if (streamId && streamId !== 'all') {
    images = images.filter(img => img.streamIds && img.streamIds.includes(streamId));
  }

  // Filter by search query (reference number, title, or tags)
  if (query) {
    images = images.filter(img => {
      const matchRef = img.referenceNumber?.toLowerCase().includes(query);
      const matchTitle = img.title?.toLowerCase().includes(query);
      const matchDesc = img.description?.toLowerCase().includes(query);
      const matchTags = img.tags?.some(tag => tag.toLowerCase().includes(query));
      return matchRef || matchTitle || matchDesc || matchTags;
    });
  }

  // If not admin, sanitize out adminNotes
  if (!isAdmin) {
    images = images.map(img => {
      const { adminNotes, ...publicImg } = img;
      return publicImg as FeedImage;
    });
  }

  return NextResponse.json(images);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      url, 
      title, 
      referenceNumber, 
      adminNotes, 
      tags, 
      streamIds, 
      description 
    } = body;

    if (!url || !url.trim()) {
      return NextResponse.json({ error: 'Image Link (URL) is required.' }, { status: 400 });
    }

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Image Title is required.' }, { status: 400 });
    }

    // Process tags
    let processedTags: string[] = [];
    if (Array.isArray(tags)) {
      processedTags = tags.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      processedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    // Process stream IDs
    let processedStreams: string[] = [];
    if (Array.isArray(streamIds)) {
      processedStreams = streamIds.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof streamIds === 'string') {
      processedStreams = streamIds.split(',').map(s => s.trim()).filter(Boolean);
    }

    const newImage: FeedImage = {
      id: `img-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      url: url.trim(),
      title: title.trim(),
      referenceNumber: referenceNumber ? referenceNumber.trim() : `REF-${Date.now().toString().slice(-4)}`,
      adminNotes: adminNotes ? adminNotes.trim() : undefined,
      tags: processedTags,
      streamIds: processedStreams,
      description: description ? description.trim() : '',
      dateAdded: new Date().toISOString().split('T')[0],
      aspectRatio: body.aspectRatio || 'landscape',
    };

    const db = readDb();
    if (!db.images) db.images = [];
    db.images.unshift(newImage);
    const syncRes = await writeDb(db, `feat: add image [${newImage.referenceNumber || newImage.title}] via Mobile Admin`);

    return NextResponse.json({ 
      success: true, 
      image: newImage,
      syncedToGitHub: Boolean(syncRes.githubResult?.success),
      commitSha: syncRes.githubResult?.commitSha,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, url, title, referenceNumber, adminNotes, tags, streamIds, description } = body;

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    const db = readDb();
    if (!db.images) db.images = [];
    const index = db.images.findIndex((img: FeedImage) => img.id === id);

    if (index === -1) {
      return NextResponse.json({ error: 'Image not found' }, { status: 404 });
    }

    let processedTags = db.images[index].tags;
    if (Array.isArray(tags)) {
      processedTags = tags.map(t => String(t).trim()).filter(Boolean);
    } else if (typeof tags === 'string') {
      processedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    let processedStreams = db.images[index].streamIds;
    if (Array.isArray(streamIds)) {
      processedStreams = streamIds.map(s => String(s).trim()).filter(Boolean);
    } else if (typeof streamIds === 'string') {
      processedStreams = streamIds.split(',').map(s => s.trim()).filter(Boolean);
    }

    db.images[index] = {
      ...db.images[index],
      url: url !== undefined ? url.trim() : db.images[index].url,
      title: title !== undefined ? title.trim() : db.images[index].title,
      referenceNumber: referenceNumber !== undefined ? referenceNumber.trim() : db.images[index].referenceNumber,
      adminNotes: adminNotes !== undefined ? adminNotes.trim() : db.images[index].adminNotes,
      tags: processedTags,
      streamIds: processedStreams,
      description: description !== undefined ? description.trim() : db.images[index].description,
    };

    const syncRes = await writeDb(db, `feat: update image [${db.images[index].referenceNumber || id}] via Mobile Admin`);
    return NextResponse.json({ 
      success: true, 
      image: db.images[index],
      syncedToGitHub: Boolean(syncRes.githubResult?.success),
    });
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
    if (db.images) {
      db.images = db.images.filter((img: FeedImage) => img.id !== id);
      const syncRes = await writeDb(db, `feat: delete image [${id}] via Mobile Admin`);
      return NextResponse.json({ 
        success: true, 
        message: 'Image deleted successfully',
        syncedToGitHub: Boolean(syncRes.githubResult?.success),
      });
    }

    return NextResponse.json({ success: true, message: 'Image deleted successfully' });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
