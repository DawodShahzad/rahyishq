import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ImageDetailClient from './ImageDetailClient';
import { FeedImage, StreamItem } from '@/types';
import { getServerDb } from '@/lib/serverDb';

interface PageProps {
  params: Promise<{ id: string }>;
}

function getDbData() {
  return getServerDb();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const rawId = (await params).id;
  const id = decodeURIComponent(rawId);
  const db = getDbData();
  const image: FeedImage | undefined = db.images?.find((img: FeedImage) => img.id === id || img.id === rawId);
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
  const rawId = (await params).id;
  const id = decodeURIComponent(rawId);
  const db = getDbData();
  const image: FeedImage | undefined = db.images?.find((img: FeedImage) => img.id === id || img.id === rawId);
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
