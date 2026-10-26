'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Upload, 
  Link as LinkIcon, 
  Image as ImageIcon, 
  X, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle,
  FileCheck,
  FolderOpen
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
 * Resizes large photos so they don't exceed serverless/network limits.
 */
export async function processLocalImageFile(
  file: File,
  maxDimension = 1920,
  quality = 0.85
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

    // Direct read for SVG / animated GIF to preserve vector sharpness or animation
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

        // Downscale proportionally if larger than maxDimension
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

export default function ImageFileInput({
  value,
  onChange,
  label = 'Image Source',
  required = false,
  helperText,
  compact = false,
  maxDimension = 1920,
  quality = 0.85,
}: ImageFileInputProps) {
  // Determine initial mode based on whether the value is a local data: URL or http(s) URL
  const isDataUrl = value?.startsWith('data:');
  const [mode, setMode] = useState<'file' | 'url'>(isDataUrl ? 'file' : 'file');
  const [dragActive, setDragActive] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [fileMeta, setFileMeta] = useState<{
    name: string;
    originalSize: number;
    optimizedSize: number;
    dimensions: string;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clear file meta if value was wiped externally (e.g. form reset)
  useEffect(() => {
    if (!value) {
      setFileMeta(null);
      setErrorMessage('');
    }
  }, [value]);

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
            <LinkIcon className="w-3.5 h-3.5 text-neutral-700" />
            <span>Image URL Link</span>
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

      {/* MODE 1: LOCAL FILE UPLOAD */}
      {mode === 'file' && (
        <div>
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
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Local
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
                  <span className="text-[11px] text-neutral-400 mt-0.5">Compressing for lightning-fast loads</span>
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
        </div>
      )}

      {/* MODE 2: DIRECT IMAGE URL */}
      {mode === 'url' && (
        <div className="space-y-2">
          <div className="relative">
            <input
              type="text"
              value={isDataUrl ? '' : value}
              onChange={(e) => {
                setErrorMessage('');
                onChange(e.target.value);
              }}
              placeholder="https://images.unsplash.com/... or any direct public image URL"
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

          {/* Live Preview for URL */}
          {value && !isDataUrl && (
            <div className="p-2.5 bg-white border border-neutral-200 rounded-xl inline-flex items-center gap-3">
              <img
                src={value}
                alt="URL Preview"
                onError={() => setErrorMessage('The image URL could not be loaded. Please ensure it is a direct public image link.')}
                className="h-16 w-16 rounded-lg object-contain bg-neutral-100 border border-neutral-200"
              />
              <div className="text-xs">
                <span className="font-medium text-neutral-800 block truncate max-w-xs">
                  {value}
                </span>
                <span className="text-[11px] text-emerald-600 flex items-center gap-1 mt-0.5">
                  <CheckCircle2 className="w-3 h-3" /> Direct URL Link
                </span>
              </div>
            </div>
          )}
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
