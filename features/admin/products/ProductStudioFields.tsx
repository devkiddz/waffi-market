'use client';

/* SHELSEA_PRODUCT_STUDIO_COLOR_AUTHORITY_V1 */

import { ArrowDown, ArrowUp, ImagePlus, PackagePlus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';

import { MediaQuickUploader } from '@/features/admin/media';
import {
  StudioMediaCropDialog,
  StudioSelectField
} from '@/features/studio-controls';
import type { StudioMediaAsset } from '@/features/admin/media';
import { cn } from '@/lib/utils';

export type ProductStudioMedia = Pick<
  StudioMediaAsset,
  'id' | 'secureUrl' | 'displayName' | 'originalFilename'
> & {
  metadata?: unknown;
  resourceType?: 'IMAGE' | 'VIDEO' | 'RAW';
};

export type ProductStudioVariant = {
  id?: string;
  label: string;
  color: string;
  colorHex: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  mediaAssetId: string | null;
  quantity: number;
  reserved: number;
  reorderLevel: number;
  active: boolean;
};

function newVariant(): ProductStudioVariant {
  return {
    label: 'Standard',
    color: '',
    colorHex: '',
    sku: '',
    price: 0,
    compareAtPrice: null,
    mediaAssetId: null,
    quantity: 0,
    reserved: 0,
    reorderLevel: 5,
    active: true
  };
}

function pickerHex(value: string): string {
  const normalized = value.trim();

  return /^#[0-9a-f]{6}$/i.test(normalized)
    ? normalized
    : '#f43f5e';
}

export function ProductStudioFields({
  media,
  initialMediaIds,
  initialVariants,
  apiBasePath = '/api/admin/media',
  canUpload = true,
  retainedImageCount = 0
}: {
  media: ProductStudioMedia[];
  initialMediaIds: string[];
  initialVariants: ProductStudioVariant[];
  apiBasePath?: string;
  canUpload?: boolean;
  retainedImageCount?: number;
}) {
  const [availableMedia, setAvailableMedia] = useState(media);
  const [selectedMediaIds, setSelectedMediaIds] = useState(initialMediaIds);
  const [mediaTouched, setMediaTouched] = useState(false);
  const [variants, setVariants] = useState(initialVariants.length ? initialVariants : [newVariant()]);

  const imageMedia = useMemo(
    () => availableMedia.filter(asset => !asset.resourceType || asset.resourceType === 'IMAGE'),
    [availableMedia]
  );
  const mediaById = useMemo(() => new Map(imageMedia.map(asset => [asset.id, asset])), [imageMedia]);

  const toggleMedia = (id: string) => {
    setMediaTouched(true);
    setSelectedMediaIds(current => current.includes(id) ? current.filter(item => item !== id) : [...current, id]);
  };

  const moveMedia = (index: number, direction: -1 | 1) => {
    setMediaTouched(true);
    setSelectedMediaIds(current => {
      const next = [...current];
      const target = index + direction;
      if (target < 0 || target >= next.length) return current;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  };

  const updateVariant = <K extends keyof ProductStudioVariant>(index: number, key: K, value: ProductStudioVariant[K]) => {
    setVariants(current => current.map((variant, variantIndex) => variantIndex === index ? { ...variant, [key]: value } : variant));
  };

  return (
    <>
      <input type="hidden" name="mediaSelectionTouched" value={mediaTouched ? 'true' : 'false'} />
      {selectedMediaIds.map(id => <input key={id} type="hidden" name="mediaAssetIds" value={id} />)}
      <input type="hidden" name="variantsJson" value={JSON.stringify(variants)} />

      <section className="rounded-[2rem] border border-border/60 bg-card/75 p-5 shadow-lg sm:p-6">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><ImagePlus className="size-4" /></span>
          <div>
            <h2 className="font-bold">Product gallery</h2>
            <p className="mt-1 text-xs leading-5 text-muted-foreground">Select uploaded Media Studio images. The first selected image is the primary product image.</p>
          </div>
        </div>

        {canUpload ? (
          <div className="mt-5">
            <MediaQuickUploader
              apiBasePath={apiBasePath}
              purpose="products"
              accept="image"
              multiple
              compact
              onUploaded={asset => {
                setAvailableMedia(current => [asset, ...current.filter(item => item.id !== asset.id)]);
                setMediaTouched(true);
                setSelectedMediaIds(current => Array.from(new Set([...current, asset.id])));
              }}
            />
          </div>
        ) : null}

        {selectedMediaIds.length ? (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
            {selectedMediaIds.map((id, index) => {
              const asset = mediaById.get(id);
              if (!asset) return null;
              return (
                <article key={id} className="overflow-hidden rounded-2xl border border-primary/30 bg-background">
                  <div className="relative aspect-square">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={asset.secureUrl} alt="" className="size-full object-cover" />
                    <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-1 text-[8px] font-bold text-white">{index === 0 ? 'PRIMARY' : index + 1}</span>
                    <span className="absolute right-2 top-2">
                      <StudioMediaCropDialog
                        assetId={asset.id}
                        imageUrl={asset.secureUrl}
                        metadata={asset.metadata}
                        initialPurpose={index === 0 ? 'product-square' : 'product-gallery'}
                        compact
                      />
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1 p-2">
                    <button type="button" onClick={() => moveMedia(index, -1)} disabled={index === 0} className="grid size-8 place-items-center rounded-xl bg-muted disabled:opacity-30" aria-label="Move image earlier"><ArrowUp className="size-3.5" /></button>
                    <button type="button" onClick={() => moveMedia(index, 1)} disabled={index === selectedMediaIds.length - 1} className="grid size-8 place-items-center rounded-xl bg-muted disabled:opacity-30" aria-label="Move image later"><ArrowDown className="size-3.5" /></button>
                    <button type="button" onClick={() => toggleMedia(id)} className="grid size-8 place-items-center rounded-xl bg-rose-500/10 text-rose-600" aria-label="Remove image"><Trash2 className="size-3.5" /></button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : retainedImageCount > 0 && !mediaTouched ? (
          <div className="mt-5 rounded-3xl border border-amber-500/25 bg-amber-500/8 p-5 text-xs leading-5 text-amber-700">
            This product already has {retainedImageCount} saved image{retainedImageCount === 1 ? '' : 's'}. They will remain attached until you select or remove Media Studio images here.
          </div>
        ) : (
          <div className="mt-5 rounded-3xl border border-dashed border-border/70 p-6 text-center text-xs text-muted-foreground">No product gallery selected yet.</div>
        )}

        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {imageMedia.map(asset => {
            const selected = selectedMediaIds.includes(asset.id);
            return (
              <div key={asset.id} className={cn('relative aspect-square overflow-hidden rounded-2xl border transition', selected ? 'border-primary ring-2 ring-primary/20' : 'border-border/60 opacity-75 hover:opacity-100')}>
                <button type="button" onClick={() => toggleMedia(asset.id)} className="absolute inset-0 z-0">
                  <span className="sr-only">Select {asset.displayName ?? asset.originalFilename ?? asset.id}</span>
                </button>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.secureUrl} alt={asset.displayName ?? asset.originalFilename ?? ''} className="pointer-events-none size-full object-cover" />
                <span className="absolute right-2 top-2 z-10">
                  <StudioMediaCropDialog
                    assetId={asset.id}
                    imageUrl={asset.secureUrl}
                    metadata={asset.metadata}
                    initialPurpose="product-gallery"
                    compact
                  />
                </span>
                {selected ? <span className="pointer-events-none absolute inset-0 grid place-items-center bg-primary/25 text-xs font-black text-white">SELECTED</span> : null}
              </div>
            );
          })}
        </div>
        {!imageMedia.length ? <p className="mt-5 text-xs text-amber-700">Upload product images here or in Media Studio before building the gallery.</p> : null}
      </section>

      <section className="rounded-[2rem] border border-border/60 bg-card/75 p-5 shadow-lg sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary"><PackagePlus className="size-4" /></span>
            <div>
              <h2 className="font-bold">Variants and inventory</h2>
              <p className="mt-1 text-xs leading-5 text-muted-foreground">Manage option/size, colour, SKU, variant media, pricing and stock from the same Product Studio.</p>
            </div>
          </div>
          <button type="button" onClick={() => setVariants(current => [...current, newVariant()])} className="shrink-0 rounded-full bg-foreground px-3 py-2 text-[9px] font-bold text-background">Add variant</button>
        </div>

        <div className="mt-5 space-y-3">
          {variants.map((variant, index) => (
            <article key={variant.id ?? `new-${index}`} className="rounded-3xl border border-border/60 bg-background/55 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs font-black">Variant {index + 1}</p>
                <button type="button" onClick={() => setVariants(current => current.length === 1 ? current : current.filter((_, itemIndex) => itemIndex !== index))} disabled={variants.length === 1} className="grid size-8 place-items-center rounded-xl bg-rose-500/10 text-rose-600 disabled:opacity-30"><Trash2 className="size-3.5" /></button>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Option / size">
                  <input
                    value={variant.label}
                    onChange={event =>
                      updateVariant(
                        index,
                        'label',
                        event.target.value
                      )
                    }
                    placeholder="M, 50ml, 18in, Size 39…"
                    className={fieldClass}
                  />
                </Field>
                <Field label="Colour name (optional)">
                  <input
                    value={variant.color}
                    onChange={event =>
                      updateVariant(
                        index,
                        'color',
                        event.target.value
                      )
                    }
                    placeholder="Black, Rose, Navy…"
                    className={fieldClass}
                  />
                </Field>
                <Field label="Colour code">
                  <div className="grid grid-cols-[2.75rem_minmax(0,1fr)] gap-2">
                    <input
                      type="color"
                      aria-label={`Pick colour for variant ${index + 1}`}
                      value={pickerHex(variant.colorHex)}
                      onChange={event =>
                        updateVariant(
                          index,
                          'colorHex',
                          event.target.value.toUpperCase()
                        )
                      }
                      className="h-10 w-11 cursor-pointer rounded-xl border border-border/70 bg-background p-1"
                    />
                    <input
                      value={variant.colorHex}
                      onChange={event =>
                        updateVariant(
                          index,
                          'colorHex',
                          event.target.value
                        )
                      }
                      placeholder="#111111"
                      className={fieldClass}
                    />
                  </div>
                </Field>
                <Field label="SKU"><input value={variant.sku} onChange={event => updateVariant(index, 'sku', event.target.value)} className={fieldClass} /></Field>
                <Field label="Price"><input type="number" min="0" step="0.01" value={variant.price} onChange={event => updateVariant(index, 'price', Number(event.target.value))} className={fieldClass} /></Field>
                <Field label="Compare at"><input type="number" min="0" step="0.01" value={variant.compareAtPrice ?? ''} onChange={event => updateVariant(index, 'compareAtPrice', event.target.value ? Number(event.target.value) : null)} className={fieldClass} /></Field>
                <Field label="Quantity"><input type="number" min="0" value={variant.quantity} onChange={event => updateVariant(index, 'quantity', Number(event.target.value))} className={fieldClass} /></Field>
                <Field label="Reserved"><input type="number" min="0" value={variant.reserved} onChange={event => updateVariant(index, 'reserved', Number(event.target.value))} className={fieldClass} /></Field>
                <Field label="Reorder level"><input type="number" min="0" value={variant.reorderLevel} onChange={event => updateVariant(index, 'reorderLevel', Number(event.target.value))} className={fieldClass} /></Field>
                <Field label="Variant image">
                  <StudioSelectField
                    value={variant.mediaAssetId ?? ''}
                    onValueChange={value => updateVariant(index, 'mediaAssetId', value || null)}
                    options={[
                      { value: '', label: 'Use primary image' },
                      ...imageMedia.map(asset => ({
                        value: asset.id,
                        label: asset.displayName ?? asset.originalFilename ?? asset.id
                      }))
                    ]}
                    className="h-10 rounded-xl text-xs"
                  />
                </Field>
              </div>
              <label className="mt-3 flex items-center gap-2 text-[10px] font-bold"><input type="checkbox" checked={variant.active} onChange={event => updateVariant(index, 'active', event.target.checked)} /> Active variant</label>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

const fieldClass = 'h-10 w-full rounded-xl border border-border/70 bg-background px-3 text-xs outline-none focus:border-primary';
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label><span className="mb-1.5 block text-[8px] font-bold uppercase tracking-[0.12em] text-muted-foreground">{label}</span>{children}</label>; }
