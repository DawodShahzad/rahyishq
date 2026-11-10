import { NextResponse } from 'next/server';
import { ENABLE_ADMIN_ACCESS } from '@/config/adminAccess';
import { writeBatchServerDb } from '@/lib/serverDb';
import { ExtraRepoFile } from '@/lib/githubSync';
import { FeedImage, HeroImage, StreamItem, AudioTrack, SiteSettings } from '@/types';

const MIME_TO_EXT: Record<string, string> = {
  'image/webp': 'webp',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/avif': 'avif',
};

function extractDataUrlImage(
  dataUrl: string,
  baseId: string,
  extraFiles: ExtraRepoFile[]
): string {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,(.+)$/);
  if (!match) return dataUrl;

  const mime = match[1].toLowerCase();
  const base64Body = match[2].replace(/\s+/g, '');
  const ext = MIME_TO_EXT[mime] || 'webp';
  const safeId = baseId.replace(/[^a-zA-Z0-9_-]/g, '-');
  const uniqueSuffix = Date.now().toString(36).slice(-5);
  const filename = `${safeId}-${uniqueSuffix}.${ext}`;

  extraFiles.push({
    path: `public/uploads/${filename}`,
    contentBase64: base64Body,
  });

  return `/uploads/${filename}`;
}

export async function POST(req: Request) {
  if (!ENABLE_ADMIN_ACCESS) {
    return NextResponse.json({ error: 'Admin portal is disabled.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      images,
      streams,
      heroImages,
      audioTracks,
      settings,
      commitMessage,
    }: {
      images?: FeedImage[];
      streams?: StreamItem[];
      heroImages?: HeroImage[];
      audioTracks?: AudioTrack[];
      settings?: SiteSettings;
      commitMessage?: string;
    } = body;

    const extraFiles: ExtraRepoFile[] = [];

    // 1. Extract any base64 image uploads on feed images into public/uploads/*
    const processedImages: FeedImage[] | undefined = Array.isArray(images)
      ? images.map((img) => {
          const url = typeof img.url === 'string' ? img.url.trim() : '';
          const finalUrl = url.startsWith('data:image/')
            ? extractDataUrlImage(url, img.id || 'img', extraFiles)
            : url;
          return {
            ...img,
            url: finalUrl,
            title: (img.title || '').trim(),
            referenceNumber: (img.referenceNumber || '').trim(),
            adminNotes: img.adminNotes ? img.adminNotes.trim() : undefined,
            tags: Array.isArray(img.tags)
              ? img.tags.map((t) => String(t).trim()).filter(Boolean)
              : [],
            streamIds: Array.isArray(img.streamIds)
              ? Array.from(new Set(img.streamIds.map((s) => String(s).trim()).filter(Boolean)))
              : [],
            description: (img.description || '').trim(),
          };
        })
      : undefined;

    // 2. Extract any base64 image uploads on hero images into public/uploads/*
    const processedHeroImages: HeroImage[] | undefined = Array.isArray(heroImages)
      ? heroImages.map((hero) => {
          const url = typeof hero.url === 'string' ? hero.url.trim() : '';
          const finalUrl = url.startsWith('data:image/')
            ? extractDataUrlImage(url, hero.id || 'hero', extraFiles)
            : url;
          return {
            ...hero,
            url: finalUrl,
            title: hero.title ? hero.title.trim() : '',
            audioUrl: hero.audioUrl ? hero.audioUrl.trim() : undefined,
          };
        })
      : undefined;

    // 3. Extract large base64 background/logo images in settings (> 80KB) so db.json stays compact
    let processedSettings: SiteSettings | undefined = settings ? { ...settings } : undefined;
    if (processedSettings) {
      if (
        typeof processedSettings.homeBgImageUrl === 'string' &&
        processedSettings.homeBgImageUrl.startsWith('data:image/')
      ) {
        processedSettings.homeBgImageUrl = extractDataUrlImage(
          processedSettings.homeBgImageUrl,
          'home-bg',
          extraFiles
        );
      }
      if (
        typeof processedSettings.logoUrl === 'string' &&
        processedSettings.logoUrl.startsWith('data:image/') &&
        processedSettings.logoUrl.length > 80_000
      ) {
        processedSettings.logoUrl = extractDataUrlImage(
          processedSettings.logoUrl,
          'brand-logo',
          extraFiles
        );
      }
    }

    const finalCommitMessage =
      (commitMessage && commitMessage.trim()) ||
      `chore(admin): batch save all changes (${processedImages?.length ?? 0} images, ${extraFiles.length} uploaded file(s))`;

    const syncRes = await writeBatchServerDb(
      (currentDb: any) => {
        const nextDb = { ...(currentDb || {}) };

        if (processedImages !== undefined) {
          // Preserve live view/download counts already stored on GitHub/local db.json
          const existingStatsById = new Map<string, { views?: number; downloads?: number }>();
          for (const existing of currentDb?.images || []) {
            if (existing?.id) {
              existingStatsById.set(existing.id, {
                views: existing.views,
                downloads: existing.downloads,
              });
            }
          }

          nextDb.images = processedImages.map((img) => {
            const existingStats = existingStatsById.get(img.id);
            if (!existingStats) return img;
            const mergedViews = Math.max(img.views || 0, existingStats.views || 0);
            const mergedDownloads = Math.max(img.downloads || 0, existingStats.downloads || 0);
            return {
              ...img,
              ...(mergedViews > 0 ? { views: mergedViews } : {}),
              ...(mergedDownloads > 0 ? { downloads: mergedDownloads } : {}),
            };
          });
        }

        if (Array.isArray(streams)) {
          nextDb.streams = streams;
        }

        if (processedHeroImages !== undefined) {
          nextDb.heroImages = processedHeroImages;
        }

        if (Array.isArray(audioTracks)) {
          nextDb.audioTracks = audioTracks;
        }

        if (processedSettings !== undefined) {
          nextDb.settings = {
            ...(currentDb?.settings || {}),
            ...processedSettings,
          };
        }

        return nextDb;
      },
      extraFiles,
      finalCommitMessage
    );

    const isSynced = Boolean(syncRes.githubResult?.success);
    const githubError = syncRes.githubResult?.error;

    return NextResponse.json({
      success: true,
      localWritten: syncRes.localWritten,
      syncedToGitHub: isSynced,
      commitSha: syncRes.githubResult?.commitSha,
      commitUrl: syncRes.githubResult?.commitUrl,
      uploadedFilesCount: extraFiles.length,
      images: processedImages,
      heroImages: processedHeroImages,
      settings: processedSettings,
      githubError: isSynced ? undefined : githubError,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to save all changes.' },
      { status: 500 }
    );
  }
}
