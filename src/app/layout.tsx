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

export const metadata: Metadata = {
  title: 'Dar-ul-Ehsan Archive | Visual Stream & Manuscripts',
  description: 'A minimalist archival stream of images, sacred manuscripts, and historical photographs of Hazrat Sufi Abu Anees Muhammad Barkat Ali (رحمۃ اللہ علیہ).',
  icons: {
    icon: '/favicon/favicon.ico',
  },
  openGraph: {
    title: 'Dar-ul-Ehsan Archive | Visual Stream',
    description: 'A minimalist visual stream of images, sacred manuscripts, and historical photographs.',
    siteName: 'Dar-ul-Ehsan Archive',
    type: 'website',
  },
};

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
