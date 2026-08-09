import 'server-only';

import { createHash, timingSafeEqual } from 'node:crypto';

import {
  mediaHardLimitBytes,
  mediaHardLimitMb
} from '@/features/media/mediaPolicy';

export type MediaUploadPurpose =
  | 'general'
  | 'products'
  | 'banners'
  | 'stories'
  | 'reels'
  | 'collections'
  | 'promotions';


export function assertCloudinaryUploadSize(upload: Record<string, unknown>) {
  const resourceType =
    typeof upload.resource_type === 'string' ? upload.resource_type : '';
  const bytes = typeof upload.bytes === 'number' ? upload.bytes : Number(upload.bytes ?? 0);

  if (!Number.isFinite(bytes) || bytes < 0) {
    throw new Error('Cloudinary upload size is invalid.');
  }

  const policyResourceType = resourceType === 'video' ? 'VIDEO' : 'IMAGE';
  const limit = mediaHardLimitBytes(policyResourceType);

  if (bytes > limit) {
    throw new Error(
      `The uploaded ${resourceType === 'video' ? 'video' : 'image'} exceeds Waffi Market's ${mediaHardLimitMb(policyResourceType)} MB limit.`
    );
  }
}

const ALLOWED_PURPOSES = new Set<MediaUploadPurpose>([
  'general',
  'products',
  'banners',
  'stories',
  'reels',
  'collections',
  'promotions'
]);

function credentials() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    throw new Error('Cloudinary environment variables are incomplete.');
  }

  return { cloudName, apiKey, apiSecret };
}

function cleanSegment(value: string) {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]+/g, '-')
      .replace(/^-+|-+$/g, '') || 'default'
  );
}

function cleanPath(value?: string | null) {
  return (value ?? '')
    .split('/')
    .map(cleanSegment)
    .filter(Boolean)
    .join('/');
}

function signParameters(
  parameters: Record<string, string | number | boolean>,
  apiSecret: string
) {
  const payload = Object.entries(parameters)
    .filter(([, value]) => value !== '')
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('&');

  return createHash('sha1')
    .update(`${payload}${apiSecret}`)
    .digest('hex');
}

function signaturesMatch(left: string, right: string) {
  const leftBuffer = Buffer.from(left, 'utf8');
  const rightBuffer = Buffer.from(right, 'utf8');

  return (
    leftBuffer.length === rightBuffer.length &&
    timingSafeEqual(leftBuffer, rightBuffer)
  );
}

export function cloudinaryIsConfigured() {
  return Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );
}

export function cloudinaryUploadFolder({
  workspaceId,
  workspaceFolderPrefix,
  purpose,
  ownerPath
}: {
  workspaceId: string;
  workspaceFolderPrefix?: string | null;
  purpose: string;
  ownerPath?: string | null;
}) {
  if (!ALLOWED_PURPOSES.has(purpose as MediaUploadPurpose)) {
    throw new Error('Unsupported media upload purpose.');
  }

  const parts = [
    cleanSegment(workspaceFolderPrefix || 'waffi-market'),
    'workspaces',
    cleanSegment(workspaceId),
    cleanPath(ownerPath),
    cleanSegment(purpose)
  ].filter(Boolean);

  return parts.join('/');
}

export function createCloudinaryUploadSignature({
  workspaceId,
  workspaceFolderPrefix,
  purpose,
  ownerPath
}: {
  workspaceId: string;
  workspaceFolderPrefix?: string | null;
  purpose: string;
  ownerPath?: string | null;
}) {
  const { cloudName, apiKey, apiSecret } = credentials();
  const timestamp = Math.floor(Date.now() / 1000);
  const folder = cloudinaryUploadFolder({
    workspaceId,
    workspaceFolderPrefix,
    purpose,
    ownerPath
  });

  const signedParameters = {
    folder,
    overwrite: false,
    timestamp,
    unique_filename: true,
    use_filename: true
  };

  return {
    cloudName,
    apiKey,
    timestamp,
    folder,
    overwrite: false,
    uniqueFilename: true,
    useFilename: true,
    signature: signParameters(signedParameters, apiSecret),
    uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`
  };
}

export function assertCloudinaryUploadResult(
  upload: Record<string, unknown>,
  expectedFolderRoot: string
) {
  const { cloudName, apiSecret } = credentials();
  const publicId = typeof upload.public_id === 'string' ? upload.public_id : '';
  const secureUrl = typeof upload.secure_url === 'string' ? upload.secure_url : '';
  const folder =
    typeof upload.folder === 'string'
      ? upload.folder
      : publicId.split('/').slice(0, -1).join('/');
  const resourceType =
    typeof upload.resource_type === 'string' ? upload.resource_type : '';
  const responseSignature =
    typeof upload.signature === 'string' ? upload.signature : '';
  const version =
    typeof upload.version === 'number' || typeof upload.version === 'string'
      ? upload.version
      : null;

  let parsedUrl: URL;

  try {
    parsedUrl = new URL(secureUrl);
  } catch {
    throw new Error('Cloudinary upload URL is invalid.');
  }

  if (
    parsedUrl.protocol !== 'https:' ||
    parsedUrl.hostname !== 'res.cloudinary.com' ||
    !parsedUrl.pathname.startsWith(`/${cloudName}/`)
  ) {
    throw new Error('Uploaded media must belong to the configured Cloudinary account.');
  }

  if (
    !publicId ||
    !(folder === expectedFolderRoot || folder.startsWith(`${expectedFolderRoot}/`)) ||
    !publicId.startsWith(`${expectedFolderRoot}/`)
  ) {
    throw new Error('Uploaded media does not belong to the permitted workspace folder.');
  }

  if (!['image', 'video'].includes(resourceType)) {
    throw new Error('Only image and video uploads are supported by Media Studio.');
  }

  if (!responseSignature || version === null) {
    throw new Error('Cloudinary upload verification data is missing.');
  }

  const expectedSignature = signParameters(
    {
      public_id: publicId,
      version
    },
    apiSecret
  );

  if (!signaturesMatch(responseSignature, expectedSignature)) {
    throw new Error('Cloudinary upload verification failed.');
  }
}

export async function destroyCloudinaryAsset({
  publicId,
  resourceType
}: {
  publicId: string;
  resourceType: 'image' | 'video' | 'raw';
}) {
  const { cloudName, apiKey, apiSecret } = credentials();
  const timestamp = Math.floor(Date.now() / 1000);
  const parameters = { invalidate: true, public_id: publicId, timestamp };
  const signature = signParameters(parameters, apiSecret);
  const body = new URLSearchParams({
    api_key: apiKey,
    invalidate: 'true',
    public_id: publicId,
    signature,
    timestamp: String(timestamp)
  });

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
    {
      method: 'POST',
      body,
      cache: 'no-store'
    }
  );

  if (!response.ok) {
    throw new Error(`Cloudinary deletion failed with status ${response.status}.`);
  }

  return response.json() as Promise<{ result?: string }>;
}
