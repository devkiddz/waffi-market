'use client';

import Cropper, { type Area, type Point } from 'react-easy-crop';
import {
  Check,
  Crop,
  LoaderCircle,
  RotateCcw,
  RotateCw,
  ZoomIn
} from 'lucide-react';
import { useMemo, useState } from 'react';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

import {
  readStudioCropRecipe,
  studioCropPurposeOptions
} from './cropMetadata';
import { StudioSelectField } from './StudioSelectField';
import type {
  StudioCropPurpose,
  StudioCropRecipe
} from './studioTypes';

export function StudioMediaCropDialog({
  assetId,
  imageUrl,
  metadata,
  apiBasePath = '/api/admin/media',
  initialPurpose = 'product-square',
  onSaved,
  compact = false
}: {
  assetId: string;
  imageUrl: string;
  metadata?: unknown;
  apiBasePath?: string;
  initialPurpose?: StudioCropPurpose;
  onSaved?: (recipe: StudioCropRecipe) => void;
  compact?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [purpose, setPurpose] = useState<StudioCropPurpose>(initialPurpose);
  const savedRecipe = useMemo(
    () => readStudioCropRecipe(metadata, purpose),
    [metadata, purpose]
  );
  const [crop, setCrop] = useState<Point>(savedRecipe?.crop ?? { x: 0, y: 0 });
  const [zoom, setZoom] = useState(savedRecipe?.zoom ?? 1);
  const [rotation, setRotation] = useState(savedRecipe?.rotation ?? 0);
  const [areaPercentages, setAreaPercentages] = useState<Area>(
    savedRecipe?.areaPercentages ?? { x: 0, y: 0, width: 100, height: 100 }
  );
  const [areaPixels, setAreaPixels] = useState<Area>(
    savedRecipe?.areaPixels ?? { x: 0, y: 0, width: 1, height: 1 }
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const purposeOption = studioCropPurposeOptions.find(
    option => option.value === purpose
  )!;

  const resetForPurpose = (nextPurpose: string) => {
    const typedPurpose = nextPurpose as StudioCropPurpose;
    const nextRecipe = readStudioCropRecipe(metadata, typedPurpose);

    setPurpose(typedPurpose);
    setCrop(nextRecipe?.crop ?? { x: 0, y: 0 });
    setZoom(nextRecipe?.zoom ?? 1);
    setRotation(nextRecipe?.rotation ?? 0);
    setAreaPercentages(
      nextRecipe?.areaPercentages ?? { x: 0, y: 0, width: 100, height: 100 }
    );
    setAreaPixels(
      nextRecipe?.areaPixels ?? { x: 0, y: 0, width: 1, height: 1 }
    );
    setMessage(null);
  };

  const save = async () => {
    setSaving(true);
    setMessage(null);

    const recipe: StudioCropRecipe = {
      purpose,
      aspect: purposeOption.aspect,
      crop,
      zoom,
      rotation,
      areaPercentages,
      areaPixels,
      updatedAt: new Date().toISOString()
    };

    const response = await fetch(`${apiBasePath}/assets/${assetId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        cropRecipe: recipe
      })
    });

    const payload = (await response.json().catch(() => null)) as
      | { error?: string }
      | null;

    setSaving(false);

    if (!response.ok) {
      setMessage(payload?.error ?? 'The crop could not be saved.');
      return;
    }

    onSaved?.(recipe);
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-full border border-border/70 bg-background font-bold transition hover:bg-muted',
          compact ? 'size-9 p-0' : 'h-10 px-4 text-xs'
        )}
      >
        <Crop className="size-4" />
        {compact ? <span className="sr-only">Crop media</span> : 'Crop'}
      </DialogTrigger>

      <DialogContent
        className="max-w-4xl gap-0 overflow-hidden p-0"
        style={{ animation: 'none' }}
      >
        <DialogHeader className="border-b border-border/60 p-5 pr-14">
          <DialogTitle>Non-destructive media crop</DialogTitle>
          <DialogDescription>
            The original asset remains untouched. Shelsea stores a reusable crop recipe for the selected Studio surface.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 p-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div className="relative min-h-[28rem] overflow-hidden rounded-[1.75rem] bg-black">
            <Cropper
              image={imageUrl}
              crop={crop}
              zoom={zoom}
              rotation={rotation}
              aspect={purposeOption.aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onRotationChange={setRotation}
              onCropComplete={(percentages: Area, pixels: Area) => {
                setAreaPercentages(percentages);
                setAreaPixels(pixels);
              }}
              showGrid
              objectFit="contain"
            />
          </div>

          <div className="space-y-5">
            <div>
              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                Surface preset
              </p>
              <StudioSelectField
                value={purpose}
                onValueChange={resetForPurpose}
                options={studioCropPurposeOptions.map(option => ({
                  value: option.value,
                  label: option.label
                }))}
              />
            </div>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                <ZoomIn className="size-3" /> Zoom
              </span>
              <input
                type="range"
                min="1"
                max="3"
                step="0.01"
                value={zoom}
                onChange={event => setZoom(Number(event.target.value))}
                className="w-full accent-primary"
              />
              <span className="mt-1 block text-[9px] text-muted-foreground">
                {zoom.toFixed(2)}×
              </span>
            </label>

            <label className="block">
              <span className="mb-2 flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.14em] text-muted-foreground">
                <RotateCw className="size-3" /> Rotation
              </span>
              <input
                type="range"
                min="-180"
                max="180"
                step="1"
                value={rotation}
                onChange={event => setRotation(Number(event.target.value))}
                className="w-full accent-primary"
              />
              <span className="mt-1 block text-[9px] text-muted-foreground">
                {rotation}°
              </span>
            </label>

            <button
              type="button"
              onClick={() => {
                setCrop({ x: 0, y: 0 });
                setZoom(1);
                setRotation(0);
              }}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-full border border-border text-xs font-bold"
            >
              <RotateCcw className="size-4" />
              Reset crop
            </button>

            {message ? (
              <p className="rounded-2xl bg-destructive/10 p-3 text-xs text-destructive">
                {message}
              </p>
            ) : null}
          </div>
        </div>

        <DialogFooter className="border-t border-border/60 p-4">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="h-10 rounded-full border border-border px-4 text-xs font-bold"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => void save()}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-xs font-bold text-background disabled:opacity-45"
          >
            {saving ? (
              <LoaderCircle className="size-4 animate-spin" />
            ) : (
              <Check className="size-4" />
            )}
            Save crop recipe
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
