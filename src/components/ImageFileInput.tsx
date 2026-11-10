'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Link as LinkIcon, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  FolderOpen,
  Cloud
} from 'lucide-react';

export interface ImageFileInputProps {
  value: string;
  onChange: (url: string, filename?: string, aspectRatio?: 'landscape' | 'portrait' | 'square') => void;
  label?: string;
  required?: boolean;
  helperText?: string;
  compact?: boolean;
  maxDimension?: number;
  quality?: number;
}

function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

/**
 * Optimizes and converts any local image file to a self-contained WebP/JPEG data URL.
 */
export async function processLocalImageFile(
  file: File,
  maxDimension = 1600,
  quality = 0.8
): Promise<{
  dataUrl: string;
  originalSize: number;
  optimizedSize: number;
  width: number;
  height: number;
  filename: string;
  aspectRatio: 'landscape' | 'portrait' | 'square';
}> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      return reject(new Error('Selected file is not an image. Please choose JPG, PNG, WEBP, or GIF.'));
    }

    if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve({
          dataUrl: result,
          originalSize: file.size,
          optimizedSize: result.length,
          width: 0,
          height: 0,
          filename: file.name,
          aspectRatio: 'landscape',
        });
      };
      reader.onerror = () => reject(new Error('Failed to read image file.'));
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        let detectedRatio: 'landscape' | 'portrait' | 'square' = 'landscape';
        if (width > height * 1.15) {
          detectedRatio = 'landscape';
        } else if (height > width * 1.15) {
          detectedRatio = 'portrait';
        } else {
          detectedRatio = 'square';
        }

        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          const fallbackData = e.target?.result as string;
          resolve({
            dataUrl: fallbackData,
            originalSize: file.size,
            optimizedSize: file.size,
            width,
            height,
            filename: file.name,
            aspectRatio: detectedRatio,
          });
          return;
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        let dataUrl = canvas.toDataURL('image/webp', quality);
        if (!dataUrl.startsWith('data:image/webp')) {
          dataUrl = canvas.toDataURL('image/jpeg', quality);
        }

        const optimizedSize = Math.round((dataUrl.length * 3) / 4);

        resolve({
          dataUrl,
          originalSize: file.size,
          optimizedSize,
          width,
          height,
          filename: file.name,
          aspectRatio: detectedRatio,
        });
      };

      img.onerror = () => reject(new Error('Could not decode image file.'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read image file.'));
    reader.readAsDataURL(file);
  });
}

export function sanitizeImageUrlInput(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('data:')) return trimmed;
  // Extract src="..." if user pasted an HTML <img> tag
  const imgSrcMatch = trimmed.match(/src=["']([^"']+)["']/i);
  if (imgSrcMatch && imgSrcMatch[1]) {
    return imgSrcMatch[1].trim();
  }
  // Strip accidental trailing attributes like `https://i.ibb.co/x.jpg" alt="...`
  const firstToken = trimmed.split(/["'\s<>]/)[0];
  return firstToken || trimmed;
}

export default function ImageFileInput({
  value,
  onChange,
  label = 'Image Source',
  required = false,
  helperText,
  maxDimension = 1600,
  quality = 0.8,
}: ImageFileInputProps) {
  const isDataUrl = value?.startsWith('data:');
  // Default to URL mode since user is hosting images on 3rd party CDNs
  const [mode, setMode] = useState<'url' | 'file'>(isDataUrl ? 'file' : 'url');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [urlVerified, setUrlVerified] = useState<boolean>(false);
  const [fileMeta, setFileMeta] = useState<{
    name: string;
    originalSize: number;
    optimizedSize: number;
    dimensions: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync mode when switching edited items
  useEffect(() => {
    if (value?.startsWith('data:')) {
      setMode('file');
    } else if (value) {
      setMode('url');
    }
  }, [value]);

  // Clear metadata if value was cleared
  useEffect(() => {
    if (!value) {
      setFileMeta(null);
      setErrorMessage('');
      setUrlVerified(false);
    }
  }, [value]);

  // When a CDN URL is pasted, verify and detect aspect ratio
  const handleUrlChange = (newUrl: string) => {
    setErrorMessage('');
    setUrlVerified(false);
    const trimmed = sanitizeImageUrlInput(newUrl);
    if (!trimmed) {
      onChange('');
      return;
    }

    onChange(trimmed);

    // Preload image to test validity and measure aspect ratio
    const testImg = new Image();
    testImg.onload = () => {
      setUrlVerified(true);
      const w = testImg.naturalWidth;
      const h = testImg.naturalHeight;
      let ratio: 'landscape' | 'portrait' | 'square' = 'landscape';
      if (w > h * 1.15) {
        ratio = 'landscape';
      } else if (h > w * 1.15) {
        ratio = 'portrait';
      } else {
        ratio = 'square';
      }

      // Try extract filename from URL path
      let cleanFilename = '';
      try {
        const u = new URL(trimmed);
        const segments = u.pathname.split('/');
        cleanFilename = segments[segments.length - 1] || '';
      } catch {}

      onChange(trimmed, cleanFilename, ratio);
    };

    testImg.onerror = () => {
      setErrorMessage('The image URL could not be loaded. Please ensure it is a public direct link (ends in .jpg, .png, .webp, or from an image CDN).');
    };

    testImg.src = trimmed;
  };

  const handleFile = async (file: File) => {
    setErrorMessage('');
    setIsProcessing(true);
    try {
      const result = await processLocalImageFile(file, maxDimension, quality);
      setFileMeta({
        name: result.filename,
        originalSize: result.originalSize,
        optimizedSize: result.optimizedSize,
        dimensions: result.width ? `${result.width}×${result.height}` : '',
      });
      onChange(result.dataUrl, result.filename, result.aspectRatio);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error processing image.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClear = () => {
    onChange('', undefined, undefined);
    setFileMeta(null);
    setErrorMessage('');
    setUrlVerified(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const isLocalFileActive = Boolean(value && (isDataUrl || fileMeta));

  return (
    <div className="space-y-2">
      {/* Label and Source Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <label className="block text-xs font-semibold text-neutral-800">
          {label} {required && <span className="text-red-500">*</span>}
        </label>

        {/* Mode Switcher Tabs */}
        <div className="inline-flex items-center p-0.5 bg-neutral-100 border border-neutral-200 rounded-lg text-xs">
          <button
            type="button"
            onClick={() => {
              setMode('url');
              setErrorMessage('');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              mode === 'url'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Cloud className="w-3.5 h-3.5 text-emerald-600" />
            <span>3rd Party CDN Link</span>
            <span className="hidden sm:inline text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded-full ml-1">
              Recommended
            </span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('file');
              setErrorMessage('');
            }}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-md font-medium transition-all ${
              mode === 'file'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <FolderOpen className="w-3.5 h-3.5 text-neutral-700" />
            <span>Upload from Computer</span>
          </button>
        </div>
      </div>

      {helperText && (
        <p className="text-[11px] text-neutral-500 -mt-1">{helperText}</p>
      )}

      {/* Hidden native file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* MODE 1: 3RD PARTY CDN / DIRECT IMAGE URL (RECOMMENDED) */}
      {mode === 'url' && (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={isDataUrl ? '' : value}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="e.g. https://res.cloudinary.com/... or https://i.imgur.com/... or direct CDN link"
              className="w-full px-4 py-2.5 bg-white border border-neutral-200 rounded-xl text-xs text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
            {value && !isDataUrl && (
              <button
                type="button"
                onClick={handleClear}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-neutral-400 hover:text-neutral-700"
                title="Clear URL"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <p className="text-[11px] text-neutral-500">
            Paste direct image link from your external host (Cloudinary, Imgur, ImageKit, Postimages, Supabase Storage, etc.).
          </p>

          {/* Live Preview for CDN URL */}
          {value && !isDataUrl && (
            <div className="p-3 bg-white border border-neutral-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-3 min-w-0">
                <img
                  src={value}
                  alt="CDN Preview"
                  className="h-14 w-14 rounded-lg object-contain bg-neutral-100 border border-neutral-200 shrink-0"
                />
                <div className="text-xs min-w-0">
                  <span className="font-medium text-neutral-800 block truncate max-w-sm">
                    {value}
                  </span>
                  <span className={`text-[11px] flex items-center gap-1 mt-0.5 ${urlVerified ? 'text-emerald-600' : 'text-neutral-400'}`}>
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    <span>{urlVerified ? 'Verified CDN Link' : 'CDN Image Link Attached'}</span>
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleClear}
                className="text-xs text-red-600 hover:text-red-800 px-2 py-1"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      )}

      {/* MODE 2: LOCAL FILE UPLOAD */}
      {mode === 'file' && (
        <div className="space-y-2">
          {isLocalFileActive ? (
            /* Selected File Card View */
            <div className="p-3.5 bg-white border border-neutral-200 rounded-xl shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3.5 w-full sm:w-auto">
                <div className="relative w-16 h-16 rounded-lg bg-neutral-100 border border-neutral-200 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  <img
                    src={value}
                    alt="Uploaded thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-xs text-neutral-900 truncate block">
                      {fileMeta?.name || 'Local image file ready'}
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono bg-amber-50 text-amber-700 border border-amber-200">
                      Base64 Local
                    </span>
                  </div>
                  <p className="text-[11px] text-neutral-500 mt-0.5">
                    {fileMeta ? (
                      <>
                        <span>{formatBytes(fileMeta.originalSize)}</span>
                        <span className="mx-1 text-neutral-300">→</span>
                        <span className="text-emerald-600 font-medium">
                          {formatBytes(fileMeta.optimizedSize)} (Optimized)
                        </span>
                        {fileMeta.dimensions && (
                          <span className="ml-1.5 text-neutral-400 font-mono text-[10px]">
                            • {fileMeta.dimensions}
                          </span>
                        )}
                      </>
                    ) : (
                      'High-resolution optimized data ready to publish'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end border-t sm:border-t-0 pt-2 sm:pt-0 border-neutral-100">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 text-xs font-medium bg-neutral-100 hover:bg-neutral-200 text-neutral-800 rounded-lg transition-colors flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Replace</span>
                </button>
                <button
                  type="button"
                  onClick={handleClear}
                  className="px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Remove</span>
                </button>
              </div>
            </div>
          ) : (
            /* Drag & Drop Upload Zone */
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all duration-200 ${
                dragActive
                  ? 'border-neutral-900 bg-neutral-100/80 scale-[1.01]'
                  : 'border-neutral-200 hover:border-neutral-400 bg-neutral-50/50 hover:bg-neutral-50'
              }`}
            >
              {isProcessing ? (
                <div className="flex flex-col items-center justify-center py-2 text-neutral-600">
                  <RefreshCw className="w-6 h-6 animate-spin text-neutral-900 mb-2" />
                  <span className="text-xs font-medium">Optimizing &amp; preparing image...</span>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-neutral-200 shadow-xs flex items-center justify-center mb-3 text-neutral-700">
                    <Upload className="w-5 h-5 text-neutral-800" />
                  </div>
                  <p className="text-xs font-semibold text-neutral-900 mb-1">
                    Click to browse files or drag &amp; drop an image here
                  </p>
                  <p className="text-[11px] text-neutral-500">
                    Supports JPG, PNG, WEBP, GIF, SVG • Auto-resizes high-resolution photos
                  </p>
                  <div className="mt-3 inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-neutral-200 rounded-full text-[11px] font-medium text-neutral-700 shadow-xs">
                    <FolderOpen className="w-3 h-3 text-neutral-500" />
                    <span>Choose from Local Drive</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Batch upload tip */}
          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-[11px] text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong>Cloud-Optimized:</strong> Uploaded images are auto-compressed to WebP and saved as clean files in <code className="bg-emerald-100/80 px-1 rounded">public/uploads/</code> in a single GitHub push when you click <strong>Save All Changes</strong>—keeping <code className="bg-emerald-100/80 px-1 rounded">db.json</code> lightweight and saving Cloudflare build limits.
            </span>
          </div>
        </div>
      )}

      {/* Error message if any */}
      {errorMessage && (
        <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
