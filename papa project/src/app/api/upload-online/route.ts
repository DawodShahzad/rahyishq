import { NextResponse } from 'next/server';
import { ENABLE_ADMIN_ACCESS } from '@/config/adminAccess';

export async function GET() {
  return NextResponse.json({
    imgbbConfigured: Boolean((process.env.IMGBB_API_KEY || '').trim()),
  });
}

export async function POST(req: Request) {
  if (!ENABLE_ADMIN_ACCESS) {
    return NextResponse.json({ error: 'Admin portal is disabled.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { imageBase64, name, apiKey } = body as {
      imageBase64?: string;
      name?: string;
      apiKey?: string;
    };

    if (!imageBase64 || typeof imageBase64 !== 'string') {
      return NextResponse.json({ error: 'imageBase64 is required.' }, { status: 400 });
    }

    const resolvedKey = (apiKey || process.env.IMGBB_API_KEY || '').trim();
    if (!resolvedKey) {
      return NextResponse.json(
        {
          success: false,
          noKey: true,
          error: 'No ImgBB API key configured. Image will be staged for the 1-click GitHub push instead.',
        },
        { status: 400 }
      );
    }

    const stripped = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

    const form = new FormData();
    form.append('image', stripped);
    if (name && name.trim()) {
      form.append('name', name.trim().slice(0, 80));
    }

    const res = await fetch(`https://api.imgbb.com/1/upload?key=${encodeURIComponent(resolvedKey)}`, {
      method: 'POST',
      body: form,
    });

    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success || !data?.data?.url) {
      return NextResponse.json(
        {
          success: false,
          error: data?.error?.message || `ImgBB upload failed (${res.status})`,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      success: true,
      url: data.data.url,
      displayUrl: data.data.display_url || data.data.url,
      thumbUrl: data.data.thumb?.url || data.data.url,
      host: 'imgbb',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Online upload error' },
      { status: 500 }
    );
  }
}
