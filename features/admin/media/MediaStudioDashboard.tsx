'use client';

import { useRouter } from 'next/navigation';
import {
  CheckCircle2,
  CloudUpload,
  FileImage,
  FileVideo2,
  LoaderCircle,
  Pencil,
  Save,
  Search,
  Trash2,
  X,
  UploadCloud,
  XCircle
} from 'lucide-react';
import { useMemo, useRef, useState, type FormEvent } from 'react';

import { WAFFI_MEDIA_POLICY } from '@/features/media/mediaPolicy';
import { cn } from '@/lib/utils';
import {
  StudioMediaCropDialog,
  StudioSelectField,
  type StudioCropRecipe
} from '@/features/studio-controls';
import {
  type StudioMediaAccept,
  type StudioMediaPurpose,
  uploadStudioMediaFile
} from './mediaUploadClient';

export type MediaStudioAsset = {
  id: string;
  publicId: string;
  secureUrl: string;
  resourceType: 'IMAGE' | 'VIDEO' | 'RAW';
  format: string | null;
  width: number | null;
  height: number | null;
  duration: number | null;
  bytes: number;
  folder: string | null;
  displayName: string | null;
  originalFilename: string | null;
  altText: string | null;
  metadata: unknown;
  createdAt: string;
  uploadedBy: { name: string };
  vendorProfile: { name: string } | null;
  usageCount: number;
};

type UploadState = {
  id: string;
  name: string;
  progress: number;
  status: 'uploading' | 'registering' | 'complete' | 'failed';
  error?: string;
};

const purposeOptions = [
  ['general', 'General library'],
  ['products', 'Products'],
  ['banners', 'Banners'],
  ['stories', 'Stories'],
  ['reels', 'Reels'],
  ['collections', 'Collections'],
  ['promotions', 'Promotions']
] as const;

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export function MediaStudioDashboard({
  assets,
  canUpload,
  canDelete,
  configured,
  apiBasePath = '/api/admin/media',
  uploadAccept = 'image-and-video'
}: {
  assets: MediaStudioAsset[];
  canUpload: boolean;
  canDelete: boolean;
  configured: boolean;
  apiBasePath?: string;
  uploadAccept?: StudioMediaAccept;
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [purpose, setPurpose] = useState<StudioMediaPurpose>('general');
  const [query, setQuery] = useState('');
  const [type, setType] = useState<'ALL' | 'IMAGE' | 'VIDEO'>('ALL');
  const [dragging, setDragging] = useState(false);
  const [uploads, setUploads] = useState<UploadState[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingAsset, setEditingAsset] = useState<MediaStudioAsset | null>(null);
  const [savingMetadata, setSavingMetadata] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [localAssets, setLocalAssets] = useState(assets);

  const availablePurposeOptions =
    uploadAccept === 'image'
      ? purposeOptions.filter(([value]) => value !== 'reels')
      : purposeOptions;

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return localAssets.filter(asset => {
      if (type !== 'ALL' && asset.resourceType !== type) return false;
      if (!normalized) return true;
      return [asset.displayName, asset.originalFilename, asset.publicId, asset.altText, asset.vendorProfile?.name]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(normalized));
    });
  }, [localAssets, query, type]);

  const updateUpload = (id: string, patch: Partial<UploadState>) => {
    setUploads(current => current.map(item => (item.id === id ? { ...item, ...patch } : item)));
  };

  const processFiles = async (fileList: FileList | File[]) => {
    if (!canUpload || !configured) return;
    setMessage(null);

    const files = Array.from(fileList);

    const initial = files.map(file => ({
      id: `${file.name}-${file.size}-${crypto.randomUUID()}`,
      name: file.name,
      progress: 0,
      status: 'uploading' as const
    }));
    setUploads(current => [...initial, ...current].slice(0, 12));

    for (const [index, file] of files.entries()) {
      const state = initial[index];
      try {
        await uploadStudioMediaFile({
          file,
          apiBasePath,
          purpose,
          accept: uploadAccept,
          onProgress: progress => updateUpload(state.id, { progress })
        });

        updateUpload(state.id, { status: 'complete', progress: 100 });
      } catch (error) {
        updateUpload(state.id, {
          status: 'failed',
          error: error instanceof Error ? error.message : 'Upload failed.'
        });
      }
    }

    router.refresh();
  };

  const saveMetadata = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingAsset || savingMetadata) return;

    const form = new FormData(event.currentTarget);
    setSavingMetadata(true);
    setMessage(null);

    try {
      const response = await fetch(`${apiBasePath}/assets/${editingAsset.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: String(form.get('displayName') ?? ''),
          altText: String(form.get('altText') ?? '')
        })
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to update media.');

      setEditingAsset(null);
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to update media.');
    } finally {
      setSavingMetadata(false);
    }
  };

  const deleteAsset = async (asset: MediaStudioAsset) => {
    if (!canDelete || deletingId) return;
    if (!window.confirm(`Remove ${asset.displayName ?? asset.originalFilename ?? 'this asset'} from Cloudinary and Media Studio?`)) return;

    setDeletingId(asset.id);
    setMessage(null);
    try {
      const response = await fetch(`${apiBasePath}/assets/${asset.id}`, { method: 'DELETE' });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Unable to delete media.');
      router.refresh();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete media.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-5">
      {!configured ? (
        <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-700">
          <strong>Cloudinary is not configured.</strong> Add the three Cloudinary environment variables locally and in Vercel before uploading.
        </div>
      ) : null}

      {canUpload ? (
        <section className="rounded-[2rem] border border-border/60 bg-card/75 p-5 shadow-lg sm:p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-black">Upload to workspace gallery</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">
                {uploadAccept === 'image'
                  ? `Images upload directly to Cloudinary and become reusable across your available Studios. Maximum ${WAFFI_MEDIA_POLICY.image.hardMaxMb} MB per image/GIF.`
                  : `Images and videos upload directly to Cloudinary, then become reusable assets in every Studio. Maximum ${WAFFI_MEDIA_POLICY.image.hardMaxMb} MB per image/GIF and ${WAFFI_MEDIA_POLICY.video.hardMaxMb} MB per video.`}
              </p>
            </div>
            <label className="block w-full sm:w-56">
              <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Destination folder</span>
              <StudioSelectField
                value={purpose}
                onValueChange={value => setPurpose(value as StudioMediaPurpose)}
                options={availablePurposeOptions.map(([value, label]) => ({ value, label }))}
                className="text-xs"
              />
            </label>
          </div>

          <button
            type="button"
            disabled={!configured}
            onClick={() => inputRef.current?.click()}
            onDragEnter={event => { event.preventDefault(); setDragging(true); }}
            onDragOver={event => event.preventDefault()}
            onDragLeave={event => { if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false); }}
            onDrop={event => { event.preventDefault(); setDragging(false); void processFiles(event.dataTransfer.files); }}
            className={cn(
              'mt-5 grid min-h-44 w-full place-items-center rounded-3xl border border-dashed p-6 text-center transition',
              dragging ? 'border-primary bg-primary/10' : 'border-border/70 bg-background/45 hover:border-primary/40 hover:bg-muted/40',
              !configured && 'cursor-not-allowed opacity-50'
            )}>
            <div>
              <UploadCloud className="mx-auto size-8 text-primary" />
              <p className="mt-3 text-sm font-black">Drop a media gallery here</p>
              <p className="mt-1 text-xs text-muted-foreground">{uploadAccept === 'image' ? 'or click to select multiple images' : 'or click to select multiple images and videos'}</p>
            </div>
          </button>
          <input ref={inputRef} type="file" multiple accept={uploadAccept === 'image' ? 'image/*' : uploadAccept === 'video' ? 'video/*' : 'image/*,video/*'} className="hidden" onChange={event => { if (event.target.files) void processFiles(event.target.files); event.target.value = ''; }} />

          {uploads.length ? (
            <div className="mt-5 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {uploads.map(upload => (
                <div key={upload.id} className="rounded-2xl border border-border/60 bg-background/60 p-3">
                  <div className="flex items-center gap-3">
                    {upload.status === 'complete' ? <CheckCircle2 className="size-4 shrink-0 text-emerald-500" /> : upload.status === 'failed' ? <XCircle className="size-4 shrink-0 text-rose-500" /> : <LoaderCircle className="size-4 shrink-0 animate-spin text-primary" />}
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-bold">{upload.name}</p>
                      <p className="mt-1 text-[9px] text-muted-foreground">{upload.error ?? upload.status.replaceAll('_', ' ')}</p>
                    </div>
                    <span className="text-[9px] font-bold">{upload.progress}%</span>
                  </div>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${upload.progress}%` }} /></div>
                </div>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="rounded-[2rem] border border-border/60 bg-card/75 p-4 shadow-lg sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative min-w-0 flex-1 sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search filenames, folders or vendors" className="h-11 w-full rounded-2xl border border-border/70 bg-background pl-10 pr-3 text-xs outline-none focus:border-primary" />
          </div>
          <div className="flex gap-2">
            {(['ALL', 'IMAGE', 'VIDEO'] as const).map(value => (
              <button key={value} type="button" onClick={() => setType(value)} className={cn('rounded-full px-3 py-2 text-[9px] font-bold', type === value ? 'bg-foreground text-background' : 'bg-muted text-muted-foreground')}>{value}</button>
            ))}
          </div>
        </div>

        {message ? <p className="mt-4 rounded-2xl bg-amber-500/10 p-3 text-xs text-amber-700">{message}</p> : null}

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map(asset => (
            <article key={asset.id} className="group min-w-0 overflow-hidden rounded-3xl border border-border/60 bg-background/65 shadow-sm">
              <div className="relative aspect-square overflow-hidden bg-muted">
                {asset.resourceType === 'VIDEO' ? (
                  <video src={asset.secureUrl} muted playsInline preload="metadata" className="size-full object-cover" />
                ) : (
                  // Cloudinary assets are intentionally rendered with a normal img so newly configured cloud names do not require a rebuild.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={asset.secureUrl} alt={asset.altText ?? asset.displayName ?? ''} className="size-full object-cover transition duration-500 group-hover:scale-105" />
                )}
                <span className="absolute left-2 top-2 grid size-8 place-items-center rounded-xl bg-black/55 text-white backdrop-blur-md">
                  {asset.resourceType === 'VIDEO' ? <FileVideo2 className="size-4" /> : <FileImage className="size-4" />}
                </span>
                {canUpload && asset.resourceType === 'IMAGE' ? (
                  <div className="absolute right-[5.5rem] top-2 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                    <StudioMediaCropDialog
                      assetId={asset.id}
                      imageUrl={asset.secureUrl}
                      metadata={asset.metadata}
                      compact
                      onSaved={(recipe: StudioCropRecipe) => {
                        setLocalAssets(current =>
                          current.map(item =>
                            item.id === asset.id
                              ? {
                                  ...item,
                                  metadata: {
                                    ...(item.metadata && typeof item.metadata === 'object'
                                      ? item.metadata as Record<string, unknown>
                                      : {}),
                                    studioCrops: {
                                      ...(
                                        item.metadata &&
                                        typeof item.metadata === 'object' &&
                                        'studioCrops' in item.metadata &&
                                        item.metadata.studioCrops &&
                                        typeof item.metadata.studioCrops === 'object'
                                          ? item.metadata.studioCrops as Record<string, unknown>
                                          : {}
                                      ),
                                      [recipe.purpose]: recipe
                                    }
                                  }
                                }
                              : item
                          )
                        );
                      }}
                    />
                  </div>
                ) : null}
                {canUpload ? (
                  <button
                    type="button"
                    onClick={() => setEditingAsset(asset)}
                    className="absolute right-12 top-2 grid size-8 place-items-center rounded-xl bg-black/55 text-white opacity-0 backdrop-blur-md transition hover:bg-black/80 group-hover:opacity-100 focus:opacity-100"
                    aria-label="Edit media details"
                  >
                    <Pencil className="size-3.5" />
                  </button>
                ) : null}
                {canDelete ? (
                  <button type="button" disabled={deletingId === asset.id} onClick={() => void deleteAsset(asset)} className="absolute right-2 top-2 grid size-8 place-items-center rounded-xl bg-black/55 text-white opacity-0 backdrop-blur-md transition hover:bg-rose-600 group-hover:opacity-100 focus:opacity-100 disabled:opacity-40" aria-label="Delete media">
                    {deletingId === asset.id ? <LoaderCircle className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                  </button>
                ) : null}
              </div>
              <div className="p-3">
                <p className="truncate text-[10px] font-black">{asset.displayName ?? asset.originalFilename ?? asset.publicId.split('/').pop()}</p>
                <p className="mt-1 truncate text-[9px] text-muted-foreground">{asset.format?.toUpperCase() ?? asset.resourceType} · {formatBytes(asset.bytes)}</p>
                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="truncate text-[8px] text-muted-foreground">{asset.vendorProfile?.name ?? asset.uploadedBy.name}</span>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-1 text-[8px] font-bold">{asset.usageCount} uses</span>
                </div>
              </div>
            </article>
          ))}
        </div>

        {!filtered.length ? (
          <div className="grid min-h-52 place-items-center text-center">
            <div><CloudUpload className="mx-auto size-8 text-muted-foreground" /><p className="mt-3 text-sm font-bold">No matching media</p><p className="mt-1 text-xs text-muted-foreground">Upload a gallery or adjust the search filters.</p></div>
          </div>
        ) : null}
      </section>

      {editingAsset ? (
        <div className="fixed inset-0 z-[100] grid place-items-center p-4">
          <button
            type="button"
            aria-label="Close media editor"
            onClick={() => setEditingAsset(null)}
            className="absolute inset-0 bg-black/55 backdrop-blur-sm"
          />
          <form
            onSubmit={saveMetadata}
            className="relative z-10 w-full max-w-lg rounded-[2rem] border border-border/60 bg-card p-5 shadow-2xl sm:p-6"
          >
            <button
              type="button"
              onClick={() => setEditingAsset(null)}
              aria-label="Close media editor"
              className="absolute right-4 top-4 grid size-9 place-items-center rounded-full border border-border/60 bg-background"
            >
              <X className="size-4" />
            </button>
            <p className="text-[9px] font-black uppercase tracking-[0.18em] text-primary">
              Media details
            </p>
            <h2 className="mt-2 pr-12 text-xl font-black">
              {editingAsset.displayName ?? editingAsset.originalFilename ?? 'Untitled media'}
            </h2>
            <div className="mt-5 space-y-4">
              <label className="block">
                <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Display name
                </span>
                <input
                  name="displayName"
                  defaultValue={editingAsset.displayName ?? editingAsset.originalFilename ?? ''}
                  maxLength={160}
                  className="h-11 w-full rounded-2xl border border-border/70 bg-background px-3 text-xs outline-none focus:border-primary"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Alternative text
                </span>
                <textarea
                  name="altText"
                  defaultValue={editingAsset.altText ?? ''}
                  maxLength={500}
                  rows={4}
                  className="w-full rounded-2xl border border-border/70 bg-background px-3 py-3 text-xs outline-none focus:border-primary"
                />
              </label>
              <p className="break-all rounded-2xl bg-muted/50 p-3 text-[9px] leading-4 text-muted-foreground">
                {editingAsset.publicId}
              </p>
              <button
                type="submit"
                disabled={savingMetadata}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-xs font-bold text-background disabled:opacity-45"
              >
                {savingMetadata ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Save className="size-4" />
                )}
                Save media details
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
