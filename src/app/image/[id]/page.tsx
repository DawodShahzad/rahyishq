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
  return { streams: [], images: [], audioTracks: [] };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const db = getDbData();
  const image: FeedImage | undefined = db.images?.find((img: FeedImage) => img.id === id);

  if (!image) {
    return {
      title: 'Image Not Found | Dar-ul-Ehsan Archive',
    };
  }

  const title = `${image.title} (${image.referenceNumber}) | Dar-ul-Ehsan Archive`;
  const description = image.description 
    ? image.description.slice(0, 160) + '...'
    : `Archival record #${image.referenceNumber} from Dar-ul-Ehsan Archive.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: image.url,
          width: 1200,
          height: 630,
          alt: image.title,
        },
      ],
      type: 'article',
      siteName: 'Dar-ul-Ehsan Archive',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image.url],
    },
  };
}

export default async function ImagePage({ params }: PageProps) {
  const { id } = await params;
  const db = getDbData();
  const image: FeedImage | undefined = db.images?.find((img: FeedImage) => img.id === id);

  if (!image) {
    notFound();
  }

  // Strictly strip out adminNotes so it never reaches client bundle or HTML
  const { adminNotes, ...publicImage } = image;

  return (
    <ImageDetailClient
      image={publicImage as FeedImage}
      streams={db.streams || []}
    />
  );
}
