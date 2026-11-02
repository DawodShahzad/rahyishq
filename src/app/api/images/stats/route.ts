import { NextResponse } from 'next/server';
import { trackImageStat, getImageStat } from '@/lib/analyticsStore';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
  }

  const stats = await getImageStat(id);

  return NextResponse.json({
    id,
    views: stats.views,
    downloads: stats.downloads,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, action } = body;

    if (!id) {
      return NextResponse.json({ error: 'Image ID is required' }, { status: 400 });
    }

    if (action !== 'view' && action !== 'download') {
      return NextResponse.json({ error: 'Invalid action. Must be "view" or "download"' }, { status: 400 });
    }

    const stats = await trackImageStat(id, action);

    return NextResponse.json({
      success: true,
      id,
      views: stats.views,
      downloads: stats.downloads,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
