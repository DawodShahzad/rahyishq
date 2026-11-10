'use client';

import React, { useState, useEffect } from 'react';
import { X, Lock, Tag, Layers, Check, Sparkles } from 'lucide-react';
import { FeedImage, StreamItem } from '@/types';
import ImageFileInput from '@/components/ImageFileInput';

interface EditImageModalProps {
  image: FeedImage | null;
  streams: StreamItem[];
  previewUrlOverride?: string;
  onClose: () => void;
  onSave: (updated: FeedImage, newPreviewDataUrl?: string) => void;
}

export default function EditImageModal({
  image,
  streams,
  previewUrlOverride,
  onClose,
  onSave,
}: EditImageModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [streamIds, setStreamIds] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'landscape' | 'portrait' | 'square'>('landscape');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!image) return;
    setUrl(image.url || '');
    setTitle(image.title || '');
    setReferenceNumber(image.referenceNumber || '');
    setAdminNotes(image.adminNotes || '');
    setTagsText((image.tags || []).join(', '));
    setStreamIds(image.streamIds || []);
    setDescription(image.description || '');
    setAspectRatio(image.aspectRatio || 'landscape');
    setError('');
  }, [image]);

  if (!image) return null;

  const toggleStream = (streamId: string) => {
    setStreamIds((prev) =>
      prev.includes(streamId) ? prev.filter((id) => id !== streamId) : [...prev, streamId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = url.trim();
    const trimmedTitle = title.trim();

    if (!trimmedUrl || !trimmedTitle) {
      setError('Image Link / Source and Image Title are required.');
      return;
    }

    const parsedTags = tagsText
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const updated: FeedImage = {
      ...image,
      url: trimmedUrl,
      title: trimmedTitle,
      referenceNumber: referenceNumber.trim() || image.referenceNumber || `REF-${Date.now().toString().slice(-4)}`,
      adminNotes: adminNotes.trim() || undefined,
      tags: parsedTags,
      streamIds: Array.from(new Set(streamIds)),
      description: description.trim(),
      aspectRatio,
    };

    onSave(updated, trimmedUrl.startsWith('data:image/') ? trimmedUrl : undefined);
  };

  const displayPreviewUrl = url.startsWith('/uploads/') && previewUrlOverride ? previewUrlOverride : url;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white border border-neutral-200 rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm px-5 py-4 border-b border-neutral-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-neutral-900">
              Edit Image Link &amp; Metadata
            </h3>
            <p className="text-[11px] text-neutral-500 font-mono">
              ID: {image.id} • Staged locally until you click Save All Changes
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full text-neutral-400 hover:text-neutral-800 hover:bg-neutral-100 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Image Link / Upload */}
          <div>
            <ImageFileInput
              value={url}
              onChange={(nextUrl, _filename, detectedRatio) => {
                setUrl(nextUrl);
                if (detectedRatio) setAspectRatio(detectedRatio);
              }}
              label="Image Link or Replacement File"
              required
              helperText="Edit the direct URL link or upload a new file to replace this image."
            />
            {displayPreviewUrl && displayPreviewUrl !== url && (
              <div className="mt-2 flex items-center gap-2 text-[11px] text-neutral-500">
                <img
                  src={displayPreviewUrl}
                  alt={title}
                  className="w-10 h-10 rounded-lg object-cover border border-neutral-200"
                />
                <span>Using local draft preview until live build completes.</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Image Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>

            {/* Reference Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-neutral-700">
                  Reference Number
                </label>
                <button
                  type="button"
                  onClick={() => setReferenceNumber(`DUE-REF-${Math.floor(100 + Math.random() * 900)}`)}
                  className="text-[11px] text-neutral-500 hover:text-black underline font-mono cursor-pointer"
                >
                  Auto #
                </button>
              </div>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
          </div>

          {/* Aspect Ratio */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Display Aspect Ratio
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['landscape', 'portrait', 'square'] as const).map((ratio) => (
                <button
                  key={ratio}
                  type="button"
                  onClick={() => setAspectRatio(ratio)}
                  className={`py-2 rounded-xl text-xs font-medium capitalize border transition-all cursor-pointer ${
                    aspectRatio === ratio
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-neutral-50 text-neutral-700 border-neutral-200 hover:bg-neutral-100'
                  }`}
                >
                  {ratio}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-neutral-400" />
              <span>Searchable Tags (Comma-separated)</span>
            </label>
            <input
              type="text"
              value={tagsText}
              onChange={(e) => setTagsText(e.target.value)}
              placeholder="e.g. manuscript, hikmat, 1984"
              className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {/* Folders / Streams */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-neutral-400" />
              <span>Folders / Streams</span>
            </label>
            {streams.length === 0 ? (
              <p className="text-xs text-neutral-400 p-2 bg-neutral-50 rounded-xl border border-neutral-200">
                No folders/streams created yet.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 p-3 bg-neutral-50 border border-neutral-200 rounded-xl">
                {streams.map((stream) => {
                  const active = streamIds.includes(stream.id);
                  return (
                    <button
                      type="button"
                      key={stream.id}
                      onClick={() => toggleStream(stream.id)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all cursor-pointer ${
                        active
                          ? 'bg-neutral-900 text-white'
                          : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                      }`}
                    >
                      {active ? '✓ ' : '+ '}
                      {stream.title}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Admin Notes */}
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5">
            <label className="flex items-center gap-1.5 text-xs font-bold text-amber-900 mb-1">
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>Admin Notes (Private)</span>
            </label>
            <textarea
              rows={2}
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Confidential archival notes..."
              className="w-full px-3 py-2 bg-white border border-amber-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Image description (English or Urdu)..."
              className="w-full px-3.5 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-neutral-200 hover:bg-neutral-50 text-neutral-700 text-xs font-medium rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Apply Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
