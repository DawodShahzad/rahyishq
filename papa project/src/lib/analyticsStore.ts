/**
 * Live Analytics & Stats Storage Engine
 * 
 * In Production (Vercel):
 * Serverless functions have an ephemeral/read-only filesystem.
 * If UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN (or KV_REST_API_URL and KV_REST_API_TOKEN)
 * are provided in Vercel environment variables, stats (image views, downloads, daily visitors)
 * are stored and incremented in real-time in Redis with zero site rebuilds!
 * 
 * In Localhost / Fallback:
 * If Redis environment variables are not configured, it gracefully reads and writes
 * to local `src/data/db.json`.
 */

import fs from 'fs';
import path from 'path';
import { FeedImage } from '@/types';

const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');

function getRedisConfig() {
  // 1. Direct standard names
  let url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL || process.env.STORAGE_REST_API_URL;
  let token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN || process.env.STORAGE_REST_API_TOKEN;

  // 2. Dynamic check for any prefix (e.g. STORAGE_REST_API_URL, KV_REST_API_URL, etc.)
  if (!url || !token) {
    for (const [key, value] of Object.entries(process.env)) {
      if (!value) continue;
      // Match any URL ending with REST_API_URL or REST_URL
      if (key.endsWith('REST_API_URL') || key.endsWith('REST_URL') || key.includes('REDIS_REST_URL')) {
        url = url || value;
      }
      // Match write token (avoid read-only token)
      if ((key.endsWith('REST_API_TOKEN') || key.endsWith('REST_TOKEN') || key.includes('REDIS_REST_TOKEN')) && !key.includes('READ_ONLY')) {
        token = token || value;
      }
    }
  }

  return { url, token, isConfigured: Boolean(url && token) };
}

async function callRedisCommand(command: (string | number)[]) {
  const { url, token, isConfigured } = getRedisConfig();
  if (!isConfigured || !url || !token) return null;

  try {
    const res = await fetch(`${url}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(command),
      cache: 'no-store',
    });

    if (res.ok) {
      const json = await res.json();
      return json.result;
    }
  } catch (err) {
    console.warn('[Redis Stats] Command failed:', err);
  }
  return null;
}

function readLocalDb() {
  try {
    if (fs.existsSync(dbPath)) {
      return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }
  } catch (err) {
    console.error('Error reading local db.json:', err);
  }
  return { images: [], analytics: { dailyVisitors: {}, totalVisitors: 0, totalPageViews: 0 } };
}

function writeLocalDb(data: any) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch {
    return false;
  }
}

/**
 * Increment and get image statistics (views or downloads)
 */
export async function trackImageStat(
  imageId: string,
  action: 'view' | 'download'
): Promise<{ views: number; downloads: number }> {
  const redis = getRedisConfig();

  if (redis.isConfigured) {
    const key = `img:${imageId}:${action}s`;
    const newCount = await callRedisCommand(['INCR', key]);

    // Also get the other metric
    const otherAction = action === 'view' ? 'download' : 'view';
    const otherKey = `img:${imageId}:${otherAction}s`;
    const otherCount = await callRedisCommand(['GET', otherKey]);

    const views = action === 'view' ? Number(newCount || 1) : Number(otherCount || 0);
    const downloads = action === 'download' ? Number(newCount || 1) : Number(otherCount || 0);

    // Also maintain global aggregates
    await callRedisCommand(['INCR', `stats:total_${action}s`]);

    return { views, downloads };
  }

  // Fallback to local db.json
  const db = readLocalDb();
  if (!db.images) db.images = [];
  const img = db.images.find((i: FeedImage) => i.id === imageId);

  if (img) {
    if (action === 'view') {
      img.views = (img.views || 0) + 1;
    } else {
      img.downloads = (img.downloads || 0) + 1;
    }
    writeLocalDb(db);
    return { views: img.views || 0, downloads: img.downloads || 0 };
  }

  return { views: 0, downloads: 0 };
}

/**
 * Fetch image statistics
 */
export async function getImageStat(imageId: string): Promise<{ views: number; downloads: number }> {
  const redis = getRedisConfig();

  if (redis.isConfigured) {
    const views = await callRedisCommand(['GET', `img:${imageId}:views`]);
    const downloads = await callRedisCommand(['GET', `img:${imageId}:downloads`]);
    return {
      views: Number(views || 0),
      downloads: Number(downloads || 0),
    };
  }

  const db = readLocalDb();
  const img = (db.images || []).find((i: FeedImage) => i.id === imageId);
  return {
    views: img?.views || 0,
    downloads: img?.downloads || 0,
  };
}

/**
 * Track a website visit
 */
export async function trackVisitor(
  date: string,
  isUniqueDaily: boolean
): Promise<{ todayVisitors: number; todayPageViews: number; totalVisitors: number }> {
  const redis = getRedisConfig();

  if (redis.isConfigured) {
    if (isUniqueDaily) {
      await callRedisCommand(['INCR', `visitors:daily:${date}:unique`]);
      await callRedisCommand(['INCR', 'visitors:total_unique']);
    }
    const pageviews = await callRedisCommand(['INCR', `visitors:daily:${date}:total`]);
    await callRedisCommand(['INCR', 'visitors:total_pageviews']);

    // Record date in a set so we can list all dates
    await callRedisCommand(['SADD', 'visitors:dates', date]);

    const uniqueCount = await callRedisCommand(['GET', `visitors:daily:${date}:unique`]);
    const totalUnique = await callRedisCommand(['GET', 'visitors:total_unique']);

    return {
      todayVisitors: Number(uniqueCount || 0),
      todayPageViews: Number(pageviews || 1),
      totalVisitors: Number(totalUnique || 0),
    };
  }

  // Fallback to local db.json
  const db = readLocalDb();
  if (!db.analytics) {
    db.analytics = { dailyVisitors: {}, totalVisitors: 0, totalPageViews: 0 };
  }
  if (!db.analytics.dailyVisitors) db.analytics.dailyVisitors = {};
  if (!db.analytics.dailyVisitors[date]) {
    db.analytics.dailyVisitors[date] = { unique: 0, total: 0 };
  }

  if (isUniqueDaily) {
    db.analytics.dailyVisitors[date].unique = (db.analytics.dailyVisitors[date].unique || 0) + 1;
    db.analytics.totalVisitors = (db.analytics.totalVisitors || 0) + 1;
  }
  db.analytics.dailyVisitors[date].total = (db.analytics.dailyVisitors[date].total || 0) + 1;
  db.analytics.totalPageViews = (db.analytics.totalPageViews || 0) + 1;

  writeLocalDb(db);

  return {
    todayVisitors: db.analytics.dailyVisitors[date].unique,
    todayPageViews: db.analytics.dailyVisitors[date].total,
    totalVisitors: db.analytics.totalVisitors,
  };
}

/**
 * Get visitor analytics report for admin
 */
export async function getAnalyticsReport(today: string, yesterday: string) {
  const redis = getRedisConfig();

  if (redis.isConfigured) {
    const todayUnique = await callRedisCommand(['GET', `visitors:daily:${today}:unique`]);
    const todayTotal = await callRedisCommand(['GET', `visitors:daily:${today}:total`]);
    const yestUnique = await callRedisCommand(['GET', `visitors:daily:${yesterday}:unique`]);
    const yestTotal = await callRedisCommand(['GET', `visitors:daily:${yesterday}:total`]);
    const totalUnique = await callRedisCommand(['GET', 'visitors:total_unique']);
    const totalHits = await callRedisCommand(['GET', 'visitors:total_pageviews']);
    const totalViews = await callRedisCommand(['GET', 'stats:total_views']);
    const totalDownloads = await callRedisCommand(['GET', 'stats:total_downloads']);

    // Get recorded dates
    const datesRes = await callRedisCommand(['SMEMBERS', 'visitors:dates']);
    let datesList: string[] = Array.isArray(datesRes) ? datesRes : [today];
    if (!datesList.includes(today)) datesList.push(today);
    datesList.sort((a, b) => b.localeCompare(a));
    datesList = datesList.slice(0, 30);

    const history: Array<{ date: string; unique: number; total: number }> = [];
    for (const d of datesList) {
      const u = await callRedisCommand(['GET', `visitors:daily:${d}:unique`]);
      const t = await callRedisCommand(['GET', `visitors:daily:${d}:total`]);
      history.push({
        date: d,
        unique: Number(u || 0),
        total: Number(t || 0),
      });
    }

    return {
      today,
      todayVisitors: Number(todayUnique || 0),
      todayPageViews: Number(todayTotal || 0),
      yesterday,
      yesterdayVisitors: Number(yestUnique || 0),
      yesterdayPageViews: Number(yestTotal || 0),
      totalVisitors: Number(totalUnique || 0),
      totalPageViews: Number(totalHits || 0),
      totalImageViews: Number(totalViews || 0),
      totalImageDownloads: Number(totalDownloads || 0),
      history,
      isLiveRedis: true,
    };
  }

  // Fallback to local db.json
  const db = readLocalDb();
  const analytics = db.analytics || { dailyVisitors: {}, totalVisitors: 0, totalPageViews: 0 };
  const dailyMap = analytics.dailyVisitors || {};

  const todayStats = dailyMap[today] || { unique: 0, total: 0 };
  const yesterdayStats = dailyMap[yesterday] || { unique: 0, total: 0 };

  const images: FeedImage[] = db.images || [];
  const totalImageViews = images.reduce((acc, img) => acc + (img.views || 0), 0);
  const totalImageDownloads = images.reduce((acc, img) => acc + (img.downloads || 0), 0);

  const history = Object.keys(dailyMap)
    .sort((a, b) => b.localeCompare(a))
    .slice(0, 30)
    .map((date) => ({
      date,
      unique: dailyMap[date].unique || 0,
      total: dailyMap[date].total || 0,
    }));

  return {
    today,
    todayVisitors: todayStats.unique,
    todayPageViews: todayStats.total,
    yesterday,
    yesterdayVisitors: yesterdayStats.unique,
    yesterdayPageViews: yesterdayStats.total,
    totalVisitors: analytics.totalVisitors || 0,
    totalPageViews: analytics.totalPageViews || 0,
    totalImageViews,
    totalImageDownloads,
    history,
    isLiveRedis: false,
  };
}
