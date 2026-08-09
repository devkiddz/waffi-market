'use client';

import {
  mediaHardLimitBytes,
  mediaHardLimitMb
} from '@/features/media/mediaPolicy';

export type StudioMediaPurpose =
  | 'general'
  | 'products'
  | 'banners'
  | 'stories'
  | 'reels'
  | 'collections'
  | 'promotions';

export type StudioMediaResourceType = 'IMAGE' | 'VIDEO' | 'RAW';

export type StudioMediaAsset = {
  id: string;
  secureUrl: string;
  resourceType: StudioMediaResourceType;
  displayName: string | null;
  originalFilename: string | null;
  format?: string | null;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  bytes?: number;
  metadata?: unknown;
};

export type MediaUploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  overwrite: boolean;
  uniqueFilename: boolean;
  useFilename: boolean;
  signature: string;
  uploadUrl: string;
};

export type StudioMediaAccept = 'image' | 'video' | 'image-and-video';

export function acceptsStudioMedia(file: File, accept: StudioMediaAccept): boolean {
  if (accept === 'image') return file.type.startsWith('image/');
  if (accept === 'video') return file.type.startsWith('video/');
  return file.type.startsWith('image/') || file.type.startsWith('video/');
}

export function validateStudioMediaFile(file: File, accept: StudioMediaAccept): string | null {
  if (!acceptsStudioMedia(file, accept)) {
    return accept === 'image'
      ? 'Only image files are allowed here.'
      : accept === 'video'
        ? 'Only video files are allowed here.'
        : 'Only image and video files are allowed here.';
  }

  const policyResourceType = file.type.startsWith('video/')
    ? 'VIDEO'
    : 'IMAGE';
  const maximum = mediaHardLimitBytes(policyResourceType);

  if (file.size > maximum) {
    return `${file.name} exceeds Waffi Market's ${mediaHardLimitMb(policyResourceType)} MB ${file.type.startsWith('video/') ? 'video' : 'image'} limit.`;
  }

  return null;
}

export async function requestMediaUploadSignature({
  apiBasePath,
  purpose,
  resourceType
}: {
  apiBasePath: string;
  purpose: StudioMediaPurpose;
  resourceType: 'IMAGE' | 'VIDEO';
}): Promise<MediaUploadSignature> {
  const response = await fetch(`${apiBasePath}/signature`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ purpose, resourceType })
  });

  const result = (await response.json()) as MediaUploadSignature & { error?: string };

  if (!response.ok) {
    throw new Error(result.error || 'Unable to prepare the media upload.');
  }

  return result;
}

export function uploadFileToCloudinary({
  file,
  signature,
  onProgress
}: {
  file: File;
  signature: MediaUploadSignature;
  onProgress?: (progress: number) => void;
}): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    const form = new FormData();

    form.append('file', file);
    form.append('api_key', signature.apiKey);
    form.append('timestamp', String(signature.timestamp));
    form.append('folder', signature.folder);
    form.append('overwrite', String(signature.overwrite));
    form.append('unique_filename', String(signature.uniqueFilename));
    form.append('use_filename', String(signature.useFilename));
    form.append('signature', signature.signature);

    request.open('POST', signature.uploadUrl);
    request.upload.addEventListener('progress', event => {
      if (event.lengthComputable) {
        onProgress?.(Math.round((event.loaded / event.total) * 100));
      }
    });
    request.addEventListener('load', () => {
      let result: Record<string, unknown> = {};

      try {
        result = JSON.parse(request.responseText || '{}') as Record<string, unknown>;
      } catch {
        reject(new Error('Cloudinary returned an unreadable response.'));
        return;
      }

      if (request.status >= 200 && request.status < 300) {
        resolve(result);
        return;
      }

      const errorValue = result.error;
      const message =
        errorValue && typeof errorValue === 'object' && 'message' in errorValue
          ? String(errorValue.message)
          : 'Cloudinary upload failed.';

      reject(new Error(message));
    });
    request.addEventListener('error', () => reject(new Error('Network failure during media upload.')));
    request.addEventListener('abort', () => reject(new Error('Media upload was cancelled.')));
    request.send(form);
  });
}

export async function registerStudioMedia({
  apiBasePath,
  upload
}: {
  apiBasePath: string;
  upload: Record<string, unknown>;
}): Promise<StudioMediaAsset> {
  const response = await fetch(`${apiBasePath}/assets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ upload })
  });

  const result = (await response.json()) as { asset?: StudioMediaAsset; error?: string };

  if (!response.ok || !result.asset) {
    throw new Error(result.error || 'Unable to register uploaded media.');
  }

  return result.asset;
}

export async function uploadStudioMediaFile({
  file,
  apiBasePath,
  purpose,
  accept,
  onProgress
}: {
  file: File;
  apiBasePath: string;
  purpose: StudioMediaPurpose;
  accept: StudioMediaAccept;
  onProgress?: (progress: number) => void;
}): Promise<StudioMediaAsset> {
  const validationError = validateStudioMediaFile(file, accept);

  if (validationError) {
    throw new Error(validationError);
  }

  const resourceType = file.type.startsWith('video/') ? 'VIDEO' : 'IMAGE';
  const signature = await requestMediaUploadSignature({
    apiBasePath,
    purpose,
    resourceType
  });
  const upload = await uploadFileToCloudinary({ file, signature, onProgress });
  return registerStudioMedia({ apiBasePath, upload });
}
