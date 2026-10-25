import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');

const defaultSettings = {
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
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading db.json in settings API:', err);
  }
  return { settings: defaultSettings };
}

function writeDb(data: any) {
  try {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing to db.json in settings API:', err);
    return false;
  }
}

export async function GET() {
  const db = readDb();
  return NextResponse.json({ ...defaultSettings, ...(db.settings || {}) });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
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

    const db = readDb();
    if (!db.settings) db.settings = { ...defaultSettings };

    if (logoUrl !== undefined) {
      db.settings.logoUrl = typeof logoUrl === 'string' ? logoUrl.trim() : '';
    }
    if (hideSiteName !== undefined) {
      db.settings.hideSiteName = Boolean(hideSiteName);
    }
    if (musicIconUrl !== undefined) {
      db.settings.musicIconUrl = typeof musicIconUrl === 'string' ? musicIconUrl.trim() : '';
    }
    if (waveColor !== undefined) {
      db.settings.waveColor = typeof waveColor === 'string' ? waveColor.trim() : '#84cc16';
    }
    if (homeBgImageUrl !== undefined) {
      db.settings.homeBgImageUrl = typeof homeBgImageUrl === 'string' ? homeBgImageUrl.trim() : '';
    }
    if (navbarColor !== undefined) {
      db.settings.navbarColor = typeof navbarColor === 'string' ? navbarColor.trim() : '#ffffff';
    }
    if (navbarOpacity !== undefined) {
      db.settings.navbarOpacity = typeof navbarOpacity === 'number' ? Math.max(0, Math.min(100, navbarOpacity)) : 75;
    }
    if (navbarBlur !== undefined) {
      db.settings.navbarBlur = typeof navbarBlur === 'number' ? Math.max(0, Math.min(40, navbarBlur)) : 12;
    }
    if (facebookUrl !== undefined) {
      db.settings.facebookUrl = typeof facebookUrl === 'string' ? facebookUrl.trim() : '';
    }
    if (whatsappUrl !== undefined) {
      db.settings.whatsappUrl = typeof whatsappUrl === 'string' ? whatsappUrl.trim() : '';
    }
    if (instagramUrl !== undefined) {
      db.settings.instagramUrl = typeof instagramUrl === 'string' ? instagramUrl.trim() : '';
    }
    if (tiktokUrl !== undefined) {
      db.settings.tiktokUrl = typeof tiktokUrl === 'string' ? tiktokUrl.trim() : '';
    }
    if (footerEnglishText !== undefined) {
      db.settings.footerEnglishText = typeof footerEnglishText === 'string' ? footerEnglishText.trim() : '';
    }
    if (footerArabicText !== undefined) {
      db.settings.footerArabicText = typeof footerArabicText === 'string' ? footerArabicText.trim() : '';
    }

    writeDb(db);

    return NextResponse.json({ success: true, settings: db.settings });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Server error' }, { status: 500 });
  }
}
