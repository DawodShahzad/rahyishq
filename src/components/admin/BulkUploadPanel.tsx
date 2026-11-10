'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  Link as LinkIcon,
  Layers,
  Tag,
  Plus,
  X,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Cloud,
  Sparkles,
  Image as ImageIcon,
} from 'lucide-react';
import { FeedImage, StreamItem } from '@/types';
import { processLocalImageFile, sanitizeImageUrlInput } from '@/components/ImageFileInput';

interface QueuedImageItem {
  tempId: string;
  url: string;
  title: string;
  referenceNumber: string;
  aspectRatio: 'landscape' | 'portrait' | 'square';
  sizeLabel?: string;
  sourceType: 'file' | 'url';
  imgbbStatus?: 'idle' | 'uploading' | 'done' | 'error';
  imgbbError?: string;
}

interface BulkUploadPanelProps {
  streams: StreamItem[];
  onStageImages: (newImages: FeedImage[], previewMap?: Record<string, string>) => void;
  onNotify: (type: 'success' | 'error', message: string) => void;
}

function cleanFilenameToTitle(name: string): string {
  return (
    name
      .replace(/\.[^/.]+$/, '')
      .replace(/[-_]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase())
      .trim() || 'Untitled Image'
  );
}

function generateRefNumber(offset = 0): string {
  const num = Math.floor(1000 + ((Date.now() + offset * 137) % 9000));
  return `DUE-REF-${num}`;
}

export default function BulkUploadPanel({
  streams,
  onStageImages,
  onNotify,
}: BulkUploadPanelProps) {
  const [uploadMode, setUploadMode] = useState<'files' | 'links'>('files');
  const [queue, setQueue] = useState<QueuedImageItem[]>([]);
  const [bulkLinksText, setBulkLinksText] = useState('');
  const [batchStreams, setBatchStreams] = useState<string[]>([]);
  const [batchTags, setBatchTags] = useState('');
  const [batchTitlePrefix, setBatchTitlePrefix] = useState('');
  const [isProcessingFiles, setIsProcessingFiles] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  // Optional ImgBB online host integration
  const [serverHasImgbb, setServerHasImgbb] = useState(false);
  const [customImgbbKey, setCustomImgbbKey] = useState('');
  const [showImgbbConfig, setShowImgbbConfig] = useState(false);
  const [isUploadingToImgbb, setIsUploadingToImgbb] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/upload-online')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.imgbbConfigured) setServerHasImgbb(true);
      })
      .catch(() => {});

    try {
      const savedKey = localStorage.getItem('darulehsan_imgbb_key');
      if (savedKey) setCustomImgbbKey(savedKey);
    } catch {}
  }, []);

  const hasImgbbKey = serverHasImgbb || Boolean(customImgbbKey.trim());

  const handleFilesSelected = async (files: FileList | File[]) => {
    const fileArray = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (fileArray.length === 0) {
      onNotify('error', 'Please select valid image files (JPG, PNG, WEBP, GIF, SVG).');
      return;
    }

    setIsProcessingFiles(true);
    const added: QueuedImageItem[] = [];
    let failedCount = 0;

    for (let i = 0; i < fileArray.length; i++) {
      const file = fileArray[i];
      try {
        const res = await processLocalImageFile(file, 1600, 0.82);
        const kb = Math.max(1, Math.round(res.optimizedSize / 1024));
        added.push({
          tempId: `q-${Date.now()}-${i}-${Math.random().toString(36).slice(2, 6)}`,
          url: res.dataUrl,
          title: cleanFilenameToTitle(res.filename),
          referenceNumber: generateRefNumber(i + 1),
          aspectRatio: res.aspectRatio,
          sizeLabel: `${kb} KB`,
          sourceType: 'file',
          imgbbStatus: 'idle',
        });
      } catch {
        failedCount++;
      }
    }

    setQueue((prev) => [...prev, ...added]);
    setIsProcessingFiles(false);

    if (added.length > 0) {
      onNotify(
        'success',
        `${added.length} image(s) prepared! Assign folders/tags below and click "Add All to Pending List".${failedCount ? ` (${failedCount} skipped)` : ''}`
      );
    } else if (failedCount > 0) {
      onNotify('error', 'Could not decode selected image files.');
    }
  };

  const handleParseLinks = () => {
    const lines = bulkLinksText
      .split(/\r?\n/)
      .map((line) => sanitizeImageUrlInput(line))
      .filter((line) => line.startsWith('http://') || line.startsWith('https://'));

    if (lines.length === 0) {
      onNotify('error', 'Paste at least one valid http:// or https:// image link (one per line).');
      return;
    }

    const added: QueuedImageItem[] = lines.map((url, idx) => {
      let titleFromUrl = `Image ${queue.length + idx + 1}`;
      try {
        const u = new URL(url);
        const seg = u.pathname.split('/').filter(Boolean).pop();
        if (seg && seg.includes('.')) {
          titleFromUrl = cleanFilenameToTitle(decodeURIComponent(seg));
        }
      } catch {}

      return {
        tempId: `q-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
        url,
        title: titleFromUrl,
        referenceNumber: generateRefNumber(idx + 1),
        aspectRatio: 'landscape',
        sourceType: 'url',
      };
    });

    setQueue((prev) => [...prev, ...added]);
    setBulkLinksText('');
    onNotify('success', `${added.length} image link(s) added to queue.`);
  };

  const handleUploadQueueToImgbb = async () => {
    const localItems = queue.filter((q) => q.url.startsWith('data:image/'));
    if (localItems.length === 0) {
      onNotify('error', 'No local image files in queue to upload to ImgBB.');
      return;
    }

    setIsUploadingToImgbb(true);
    let successCount = 0;

    for (const item of localItems) {
      setQueue((prev) =>
        prev.map((q) => (q.tempId === item.tempId ? { ...q, imgbbStatus: 'uploading', imgbbError: undefined } : q))
      );

      try {
        const res = await fetch('/api/upload-online', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            imageBase64: item.url,
            name: item.title,
            apiKey: customImgbbKey.trim() || undefined,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success && data.url) {
          successCount++;
          setQueue((prev) =>
            prev.map((q) =>
              q.tempId === item.tempId
                ? { ...q, url: data.url, sourceType: 'url', imgbbStatus: 'done' }
                : q
            )
          );
        } else {
          setQueue((prev) =>
            prev.map((q) =>
              q.tempId === item.tempId
                ? { ...q, imgbbStatus: 'error', imgbbError: data.error || 'Upload failed' }
                : q
            )
          );
        }
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q) =>
            q.tempId === item.tempId
              ? { ...q, imgbbStatus: 'error', imgbbError: err.message || 'Network error' }
              : q
          )
        );
      }
    }

    setIsUploadingToImgbb(false);
    if (successCount > 0) {
      onNotify('success', `Uploaded ${successCount} image(s) to ImgBB! Click "Add All to Pending List" next.`);
    } else {
      onNotify('error', 'ImgBB upload failed. Check your API key or keep staged for 1-click GitHub upload.');
    }
  };

  const handleStageAll = () => {
    if (queue.length === 0) {
      onNotify('error', 'Queue is empty. Select photos or paste image links first.');
      return;
    }

    const parsedTags = batchTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const today = new Date().toISOString().split('T')[0];
    const previewMap: Record<string, string> = {};

    const newImages: FeedImage[] = queue.map((item, idx) => {
      const id = `img-${Date.now() + idx}-${Math.random().toString(36).substring(2, 6)}`;
      if (item.url.startsWith('data:image/')) {
        previewMap[id] = item.url;
      }
      const prefix = batchTitlePrefix.trim();
      const finalTitle = prefix ? `${prefix} ${item.title}`.trim() : item.title.trim() || `Image ${idx + 1}`;

      return {
        id,
        url: item.url.trim(),
        title: finalTitle,
        referenceNumber: item.referenceNumber.trim() || generateRefNumber(idx),
        tags: parsedTags,
        streamIds: [...batchStreams],
        description: '',
        dateAdded: today,
        aspectRatio: item.aspectRatio,
      };
    });

    onStageImages(newImages, previewMap);
    setQueue([]);
    setBatchTags('');
    setBatchTitlePrefix('');
  };

  const toggleBatchStream = (streamId: string) => {
    setBatchStreams((prev) =>
      prev.includes(streamId) ? prev.filter((id) => id !== streamId) : [...prev, streamId]
    );
  };

  return (
    <div className="space-y-5">
      {/* Mode Pills: Upload Multiple Files vs Paste Multiple Links */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center p-1 bg-neutral-100 border border-neutral-200 rounded-xl text-xs">
          <button
            type="button"
            onClick={() => setUploadMode('files')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              uploadMode === 'files'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span>Upload Multiple Photos</span>
          </button>
          <button
            type="button"
            onClick={() => setUploadMode('links')}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              uploadMode === 'links'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <LinkIcon className="w-3.5 h-3.5 text-indigo-600" />
            <span>Paste Multiple Links</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowImgbbConfig((v) => !v)}
          className="inline-flex items-center gap-1.5 text-[11px] font-medium text-neutral-600 hover:text-neutral-900 bg-white border border-neutral-200 px-3 py-1.5 rounded-xl cursor-pointer"
        >
          <Cloud className="w-3.5 h-3.5 text-sky-600" />
          <span>{hasImgbbKey ? 'ImgBB Online Host Ready' : 'Optional: ImgBB Online Host'}</span>
        </button>
      </div>

      {/* Optional ImgBB Key Config Drawer */}
      {showImgbbConfig && (
        <div className="p-3.5 bg-sky-50/70 border border-sky-200 rounded-2xl text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-sky-950">
              Optional: ImgBB Direct CDN Hosting
            </span>
            <button
              type="button"
              onClick={() => setShowImgbbConfig(false)}
              className="text-sky-700 hover:text-sky-900"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-[11px] text-sky-800">
            By default, uploaded photos are committed cleanly to <code className="bg-sky-100 px-1 rounded">public/uploads/</code> inside your single GitHub push (zero external keys required). If you prefer hosting on <code className="bg-sky-100 px-1 rounded">i.ibb.co</code>, paste your ImgBB API key below (or set <code className="bg-sky-100 px-1 rounded">IMGBB_API_KEY</code> in Cloudflare env).
          </p>
          {!serverHasImgbb && (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                value={customImgbbKey}
                onChange={(e) => {
                  const val = e.target.value;
                  setCustomImgbbKey(val);
                  try {
                    if (val.trim()) localStorage.setItem('darulehsan_imgbb_key', val.trim());
                    else localStorage.removeItem('darulehsan_imgbb_key');
                  } catch {}
                }}
                placeholder="Optional ImgBB API Key..."
                className="flex-1 px-3 py-2 bg-white border border-sky-200 rounded-xl text-xs font-mono"
              />
            </div>
          )}
        </div>
      )}

      {/* MODE A: Multi-File Drag & Drop / Picker */}
      {uploadMode === 'files' ? (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                handleFilesSelected(e.target.files);
                e.target.value = '';
              }
            }}
            className="hidden"
          />
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragActive(true);
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              setDragActive(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragActive(false);
              if (e.dataTransfer.files?.length) {
                handleFilesSelected(e.dataTransfer.files);
              }
            }}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              dragActive
                ? 'border-neutral-900 bg-neutral-100/80 scale-[1.01]'
                : 'border-neutral-300 hover:border-neutral-500 bg-white hover:bg-neutral-50/70'
            }`}
          >
            {isProcessingFiles ? (
              <div className="flex flex-col items-center py-3">
                <RefreshCw className="w-6 h-6 animate-spin text-neutral-900 mb-2" />
                <span className="text-xs font-semibold text-neutral-800">
                  Optimizing images for fast web loading...
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="w-12 h-12 rounded-2xl bg-neutral-100 border border-neutral-200 flex items-center justify-center mb-3">
                  <Upload className="w-5 h-5 text-neutral-800" />
                </div>
                <p className="text-xs sm:text-sm font-bold text-neutral-900 mb-1">
                  Select or Drop Multiple Photos Here
                </p>
                <p className="text-[11px] text-neutral-500 max-w-md">
                  Upload 5, 20, or more photos at once. Nothing pushes to GitHub yet—review them, organize into folders, and push everything in 1 single commit!
                </p>
                <span className="mt-3 inline-flex items-center gap-1.5 px-4 py-1.5 bg-neutral-900 text-white rounded-full text-xs font-semibold">
                  <Plus className="w-3.5 h-3.5" />
                  <span>Choose Multiple Images</span>
                </span>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* MODE B: Paste Multiple Image URLs */
        <div className="space-y-2.5 bg-white p-4 rounded-2xl border border-neutral-200">
          <label className="block text-xs font-semibold text-neutral-800">
            Paste Direct Image Links (One URL per line)
          </label>
          <textarea
            rows={5}
            value={bulkLinksText}
            onChange={(e) => setBulkLinksText(e.target.value)}
            placeholder={`https://i.ibb.co/example1/photo1.webp\nhttps://i.ibb.co/example2/photo2.webp\nhttps://res.cloudinary.com/example3/photo3.jpg`}
            className="w-full px-3.5 py-2.5 bg-neutral-50 border border-neutral-200 rounded-xl text-xs font-mono text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-[11px] text-neutral-500">
              Automatically cleans accidental HTML &lt;img&gt; snippets.
            </span>
            <button
              type="button"
              onClick={handleParseLinks}
              className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold rounded-xl cursor-pointer"
            >
              Add Links to Queue
            </button>
          </div>
        </div>
      )}

      {/* Batch Default Settings (Folders/Streams, Tags, Title Prefix) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white border border-neutral-200 rounded-2xl p-4">
        <div>
          <label className="block text-xs font-semibold text-neutral-700 mb-1.5 flex items-center gap-1">
            <Layers className="w-3.5 h-3.5 text-neutral-400" />
            <span>Assign Batch to Folders / Streams</span>
          </label>
          {streams.length === 0 ? (
            <p className="text-[11px] text-neutral-400 italic">
              No folders/streams yet. Create one in the Streams / Folders tab.
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {streams.map((stream) => {
                const selected = batchStreams.includes(stream.id);
                return (
                  <button
                    type="button"
                    key={stream.id}
                    onClick={() => toggleBatchStream(stream.id)}
                    className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-all cursor-pointer ${
                      selected
                        ? 'bg-neutral-900 text-white'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}
                    {stream.title}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-neutral-400" />
              <span>Shared Tags for Batch (Optional)</span>
            </label>
            <input
              type="text"
              value={batchTags}
              onChange={(e) => setBatchTags(e.target.value)}
              placeholder="e.g. makalat, hikmat, calligraphy"
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Optional Title Prefix (e.g. Makala)
            </label>
            <input
              type="text"
              value={batchTitlePrefix}
              onChange={(e) => setBatchTitlePrefix(e.target.value)}
              placeholder="Leaves individual titles as-is if empty"
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>
        </div>
      </div>

      {/* Queued Items Preview & Staging Controls */}
      {queue.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-2xl p-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-100">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-neutral-800" />
              <span className="text-xs font-bold text-neutral-900">
                Upload Queue ({queue.length} image{queue.length > 1 ? 's' : ''} ready)
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {hasImgbbKey && queue.some((q) => q.url.startsWith('data:image/')) && (
                <button
                  type="button"
                  onClick={handleUploadQueueToImgbb}
                  disabled={isUploadingToImgbb}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white text-[11px] font-semibold rounded-xl cursor-pointer"
                >
                  <Cloud className="w-3.5 h-3.5" />
                  <span>{isUploadingToImgbb ? 'Uploading to ImgBB...' : 'Host Files on ImgBB'}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setQueue([])}
                className="px-3 py-1.5 border border-neutral-200 hover:bg-neutral-100 text-neutral-600 text-[11px] font-medium rounded-xl cursor-pointer"
              >
                Clear Queue
              </button>
              <button
                type="button"
                onClick={handleStageAll}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Add All ({queue.length}) to Pending List</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[380px] overflow-y-auto pr-1">
            {queue.map((item) => (
              <div
                key={item.tempId}
                className="border border-neutral-200 rounded-xl p-2.5 flex gap-2.5 bg-neutral-50/60 relative"
              >
                <img
                  src={item.url}
                  alt={item.title}
                  className="w-16 h-16 rounded-lg object-cover bg-neutral-200 shrink-0 border border-neutral-200"
                />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) =>
                      setQueue((prev) =>
                        prev.map((q) => (q.tempId === item.tempId ? { ...q, title: e.target.value } : q))
                      )
                    }
                    placeholder="Title"
                    className="w-full px-2 py-1 bg-white border border-neutral-200 rounded-lg text-[11px] font-semibold text-neutral-900"
                  />
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={item.referenceNumber}
                      onChange={(e) =>
                        setQueue((prev) =>
                          prev.map((q) =>
                            q.tempId === item.tempId ? { ...q, referenceNumber: e.target.value } : q
                          )
                        )
                      }
                      placeholder="Ref #"
                      className="w-24 px-2 py-0.5 bg-white border border-neutral-200 rounded-md text-[10px] font-mono text-neutral-700"
                    />
                    {item.sizeLabel && (
                      <span className="text-[10px] text-neutral-500 font-mono">{item.sizeLabel}</span>
                    )}
                    {item.imgbbStatus === 'done' && (
                      <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-0.5">
                        <CheckCircle2 className="w-3 h-3" /> ImgBB
                      </span>
                    )}
                    {item.imgbbStatus === 'uploading' && (
                      <span className="text-[10px] text-sky-600 font-semibold">Uploading...</span>
                    )}
                    {item.imgbbStatus === 'error' && (
                      <span className="text-[10px] text-red-600 flex items-center gap-0.5" title={item.imgbbError}>
                        <AlertCircle className="w-3 h-3" /> Err
                      </span>
                    )}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setQueue((prev) => prev.filter((q) => q.tempId !== item.tempId))}
                  className="p-1 text-neutral-400 hover:text-red-600 self-start cursor-pointer"
                  title="Remove from queue"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
