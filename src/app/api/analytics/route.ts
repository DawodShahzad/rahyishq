import { NextResponse } from 'next/server';
import { getAnalyticsReport, trackVisitor } from '@/lib/analyticsStore';

function getFormattedDate(d = new Date()): string {
  return d.toISOString().split('T')[0];
}

function getYesterdayDate(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getFormattedDate(d);
}

export async function GET() {
  const today = getFormattedDate();
  const yesterday = getYesterdayDate();
  const data = await getAnalyticsReport(today, yesterday);
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const isUniqueDaily = Boolean(body.isUniqueDaily);
    const today = getFormattedDate();

    const stats = await trackVisitor(today, isUniqueDaily);

    return NextResponse.json({
      success: true,
      today,
      ...stats,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Analytics logging error' }, { status: 500 });
  }
}

