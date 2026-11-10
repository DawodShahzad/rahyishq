import { NextResponse } from 'next/server';
import { FeedImage } from '@/types';
import { getServerDb, writeServerDb } from '@/lib/serverDb';

function readDb() {
  return getServerDb();
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
    const single = images.find(img => img.id === id || img.id === decodeURIComponent(id));
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

  // Filter by search query (reference number, title, description, or tags)
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

    const syncRes = await writeServerDb((currentDb: any) => {
      currentDb.images = currentDb.images || [];
      currentDb.images.unshift(newImage);
      return currentDb;
    }, `feat: add image [${newImage.referenceNumber || newImage.title}] via Mobile Admin`);

    const isSynced = Boolean(syncRes.githubResult?.success);
    const githubError = syncRes.githubResult?.error;

    return NextResponse.json({ 
      success: true, 
      image: newImage,
      syncedToGitHub: isSynced,
      commitSha: syncRes.githubResult?.commitSha,
      githubError: isSynced ? undefined : githubError,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, url, title, referenceNumber, adminNotes, tags, streamIds, description, aspectRatio } = body;

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    let processedTags: string[] | undefined = undefined;
    if (tags !== undefined) {
      if (Array.isArray(tags)) {
        processedTags = tags.map(t => String(t).trim()).filter(Boolean);
      } else if (typeof tags === 'string') {
        processedTags = tags.split(',').map(t => t.trim()).filter(Boolean);
      }
    }

    let processedStreams: string[] | undefined = undefined;
    if (streamIds !== undefined) {
      if (Array.isArray(streamIds)) {
        processedStreams = streamIds.map(s => String(s).trim()).filter(Boolean);
      } else if (typeof streamIds === 'string') {
        processedStreams = streamIds.split(',').map(s => s.trim()).filter(Boolean);
      }
    }

    let updatedImage: FeedImage | null = null;

    const syncRes = await writeServerDb((currentDb: any) => {
      currentDb.images = currentDb.images || [];
      const index = currentDb.images.findIndex((img: FeedImage) => img.id === id);

      if (index !== -1) {
        currentDb.images[index] = {
          ...currentDb.images[index],
          url: url !== undefined ? url.trim() : currentDb.images[index].url,
          title: title !== undefined ? title.trim() : currentDb.images[index].title,
          referenceNumber: referenceNumber !== undefined ? referenceNumber.trim() : currentDb.images[index].referenceNumber,
          adminNotes: adminNotes !== undefined ? adminNotes.trim() : currentDb.images[index].adminNotes,
          tags: processedTags !== undefined ? processedTags : currentDb.images[index].tags,
          streamIds: processedStreams !== undefined ? processedStreams : currentDb.images[index].streamIds,
          description: description !== undefined ? description.trim() : currentDb.images[index].description,
          aspectRatio: aspectRatio !== undefined ? aspectRatio : currentDb.images[index].aspectRatio,
        };
        updatedImage = currentDb.images[index];
      }
      return currentDb;
    }, `feat: update image [${id}] via Mobile Admin`);

    const isSynced = Boolean(syncRes.githubResult?.success);
    const githubError = syncRes.githubResult?.error;

    return NextResponse.json({ 
      success: true, 
      image: updatedImage,
      syncedToGitHub: isSynced,
      githubError: isSynced ? undefined : githubError,
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

    const syncRes = await writeServerDb((currentDb: any) => {
      if (currentDb.images) {
        currentDb.images = currentDb.images.filter((img: FeedImage) => img.id !== id);
      }
      return currentDb;
    }, `feat: delete image [${id}] via Mobile Admin`);

    const isSynced = Boolean(syncRes.githubResult?.success);
    const githubError = syncRes.githubResult?.error;

    return NextResponse.json({ 
      success: true, 
      message: 'Image deleted successfully',
      syncedToGitHub: isSynced,
      githubError: isSynced ? undefined : githubError,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
