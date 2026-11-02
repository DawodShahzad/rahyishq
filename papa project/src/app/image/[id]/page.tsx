import type { Metadata } from 'next';
import fs from 'fs';
import path from 'path';
import { notFound } from 'next/navigation';
import ImageDetailClient from './ImageDetailClient';
import { FeedImage, StreamItem } from '@/types';

interface PageProps {
  params: Promise<{ id: string }>;
}

function getDbData() {
  const dbPath = path.join(process.cwd(), 'src', 'data', 'db.json');
  try {
    if (fs.existsSync(dbPath)) {
      const data = fs.readFileSync(dbPath, 'utf8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading db.json in image page:', err);
  }
  return { streams: [], images: [], audioTracks: [], settings: {} };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const db = getDbData();
  const image: FeedImage | undefined = db.images?.find((img: FeedImage) => img.id === id);
  const platformName = db.settings?.platformName?.trim() || 'Rahy Ishq';

  if (!image) {
    return {
      title: `Image Not Found | ${platformName}`,
    };
  }

  // Social media preview requirements:
  // - In title preview: ONLY show the image title (no reference number)
  // - In description: Show platform name (and description if available)
  const socialTitle = image.title;
  const socialDescription = image.description 
    ? `${image.description} — ${platformName}`
    : platformName;

  return {
    title: `${socialTitle} | ${platformName}`,
    description: socialDescription,
    openGraph: {
      title: socialTitle,
      description: socialDescription,
      images: [
        {
          url: image.url,
          width: 1200,
          height: 630,
          alt: image.title,
        },
      ],
      type: 'article',
      siteName: platformName,
    },
    twitter: {
      card: 'summary_large_image',
      title: socialTitle,
      description: socialDescription,
      images: [image.url],
    },
  };
}

export default async function ImagePage({ params }: PageProps) {
  const { id } = await params;
  const db = getDbData();
  const image: FeedImage | undefined = db.images?.find((img: FeedImage) => img.id === id);
  const platformName = db.settings?.platformName?.trim() || 'Rahy Ishq';

  if (!image) {
    notFound();
  }

  // Strictly strip out adminNotes so it never reaches client bundle or HTML
  const { adminNotes, ...publicImage } = image;

  return (
    <ImageDetailClient
      image={publicImage as FeedImage}
      streams={db.streams || []}
      platformName={platformName}
    />
  );
}
