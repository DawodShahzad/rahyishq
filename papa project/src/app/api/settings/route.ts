import { NextResponse } from 'next/server';
import { getServerDb, writeServerDb } from '@/lib/serverDb';

const defaultSettings = {
  platformName: 'Rahy Ishq',
  logoUrl: '',
  hideSiteName: false,
  musicIconUrl: '',
  waveColor: '#84cc16',
  homeBgImageUrl: '',
  navbarColor: '#ffffff',
  navbarOpacity: 75,
  navbarBlur: 12,
  facebookUrl: 'https://facebook.com',
  whatsappUrl: 'https://wa.me',
  instagramUrl: 'https://instagram.com',
  tiktokUrl: 'https://tiktok.com',
  footerEnglishText: 'Preserving the photographic, calligraphic, and manuscript heritage of Hazrat Sufi Abu Anees Muhammad Barkat Ali (رحمۃ اللہ علیہ).',
  footerArabicText: 'خدمتِ خلق • ذکرِ الٰہی • نشرِ قرآن مجید',
};

function readDb() {
  const db = getServerDb();
  return db && db.settings ? db : { settings: defaultSettings };
}

export async function GET() {
  const db = readDb();
  return NextResponse.json({ ...defaultSettings, ...(db.settings || {}) });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      platformName,
      logoUrl, 
      hideSiteName, 
      musicIconUrl,
      waveColor,
      homeBgImageUrl,
      navbarColor,
      navbarOpacity,
      navbarBlur,
      facebookUrl,
      whatsappUrl,
      instagramUrl,
      tiktokUrl,
      footerEnglishText,
      footerArabicText,
    } = body;

    let updatedSettings: any = null;

    const syncRes = await writeServerDb((currentDb: any) => {
      if (!currentDb.settings) currentDb.settings = { ...defaultSettings };

      if (platformName !== undefined) {
        currentDb.settings.platformName = typeof platformName === 'string' && platformName.trim() ? platformName.trim() : 'Rahy Ishq';
      }
      if (logoUrl !== undefined) {
        currentDb.settings.logoUrl = typeof logoUrl === 'string' ? logoUrl.trim() : '';
      }
      if (hideSiteName !== undefined) {
        currentDb.settings.hideSiteName = Boolean(hideSiteName);
      }
      if (musicIconUrl !== undefined) {
        currentDb.settings.musicIconUrl = typeof musicIconUrl === 'string' ? musicIconUrl.trim() : '';
      }
      if (waveColor !== undefined) {
        currentDb.settings.waveColor = typeof waveColor === 'string' ? waveColor.trim() : '#84cc16';
      }
      if (homeBgImageUrl !== undefined) {
        currentDb.settings.homeBgImageUrl = typeof homeBgImageUrl === 'string' ? homeBgImageUrl.trim() : '';
      }
      if (navbarColor !== undefined) {
        currentDb.settings.navbarColor = typeof navbarColor === 'string' ? navbarColor.trim() : '#ffffff';
      }
      if (navbarOpacity !== undefined) {
        currentDb.settings.navbarOpacity = typeof navbarOpacity === 'number' ? Math.max(0, Math.min(100, navbarOpacity)) : 75;
      }
      if (navbarBlur !== undefined) {
        currentDb.settings.navbarBlur = typeof navbarBlur === 'number' ? Math.max(0, Math.min(40, navbarBlur)) : 12;
      }
      if (facebookUrl !== undefined) {
        currentDb.settings.facebookUrl = typeof facebookUrl === 'string' ? facebookUrl.trim() : '';
      }
      if (whatsappUrl !== undefined) {
        currentDb.settings.whatsappUrl = typeof whatsappUrl === 'string' ? whatsappUrl.trim() : '';
      }
      if (instagramUrl !== undefined) {
        currentDb.settings.instagramUrl = typeof instagramUrl === 'string' ? instagramUrl.trim() : '';
      }
      if (tiktokUrl !== undefined) {
        currentDb.settings.tiktokUrl = typeof tiktokUrl === 'string' ? tiktokUrl.trim() : '';
      }
      if (footerEnglishText !== undefined) {
        currentDb.settings.footerEnglishText = typeof footerEnglishText === 'string' ? footerEnglishText.trim() : '';
      }
      if (footerArabicText !== undefined) {
        currentDb.settings.footerArabicText = typeof footerArabicText === 'string' ? footerArabicText.trim() : '';
      }

      updatedSettings = currentDb.settings;
      return currentDb;
    }, 'feat: update appearance and branding settings via Mobile Admin');

    const isSynced = Boolean(syncRes.githubResult?.success);
    const githubError = syncRes.githubResult?.error;

    return NextResponse.json({ 
      success: true, 
      settings: updatedSettings,
      syncedToGitHub: isSynced,
      githubError: isSynced ? undefined : githubError,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
