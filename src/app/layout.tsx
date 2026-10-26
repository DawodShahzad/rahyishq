import type { Metadata } from 'next';
import { Inter, Noto_Nastaliq_Urdu } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import FloatingAudioPlayer from '@/components/FloatingAudioPlayer';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const nastaliq = Noto_Nastaliq_Urdu({
  subsets: ['arabic'],
  weight: ['400', '600', '700'],
  display: 'swap',
  variable: '--font-nastaliq',
});

import fs from 'fs';
import path from 'path';

function getPlatformSettings() {
  const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      const parsed = JSON.parse(data);
      return parsed.settings?.platformName?.trim() || 'Rahy Ishq';
    }
  } catch {}
  return 'Rahy Ishq';
}

export async function generateMetadata(): Promise<Metadata> {
  const platformName = getPlatformSettings();
  return {
    title: `${platformName} | Visual Stream & Manuscripts`,
    description: 'A minimalist archival stream of images, sacred manuscripts, and historical photographs of Hazrat Sufi Abu Anees Muhammad Barkat Ali (رحمۃ اللہ علیہ).',
    icons: {
      icon: [
        { url: '/favicon/favicon.ico', sizes: 'any' },
        { url: '/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/favicon/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { url: '/favicon/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: [
        { url: '/favicon/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
      ],
      shortcut: '/favicon/favicon.ico',
    },
    manifest: '/favicon/site.webmanifest',
    openGraph: {
      title: `${platformName} | Visual Stream`,
      description: 'A minimalist visual stream of images, sacred manuscripts, and historical photographs.',
      siteName: platformName,
      type: 'website',
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${nastaliq.variable}`}>
      <body className="min-h-screen text-neutral-900 font-sans antialiased selection:bg-neutral-900 selection:text-white">
        {/* Navigation Bar without any backend / admin links */}
        <Navbar />

        {/* Main Content Feed */}
        <main className="min-h-[85vh]">
          {children}
        </main>

        {/* Global Floating Background Audio Player */}
        <FloatingAudioPlayer />

        {/* Minimal Footer */}
        <Footer />
      </body>
    </html>
  );
}
