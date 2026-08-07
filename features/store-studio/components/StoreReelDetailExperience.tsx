'use client';

import { useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  ArrowLeft,
  Check,
  ShoppingBag,
  ShoppingCart,
  Sparkles
} from 'lucide-react';

import { useCart } from '@/features/cart';
import { cn } from '@/lib/utils';
import type { ProductType } from '@/types/types';

import type { StoreStudioReelProjection } from '../contracts';

type StoreReelDetailExperienceProps = {
  reel: StoreStudioReelProjection;
  product: ProductType | null;
};

const money = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0
});

export function StoreReelDetailExperience({
  reel,
  product
}: StoreReelDetailExperienceProps) {
  const router = useRouter();
  const { addToCart, mutating } = useCart();

  const initialVariant = useMemo(() => {
    if (!product) {
      return null;
    }

    return (
      product.variants.find(variant => variant.stockLeft > 0) ??
      product.variants[0] ??
      null
    );
  }, [product]);

  const [selectedVariantId, setSelectedVariantId] =
    useState<string | null>(initialVariant?.id ?? null);

  const selectedVariant = useMemo(() => {
    if (!product) {
      return null;
    }

    return (
      product.variants.find(
        variant => variant.id === selectedVariantId
      ) ??
      initialVariant
    );
  }, [initialVariant, product, selectedVariantId]);

  const addSelectedProduct = async (
    destination: 'stay' | 'cart'
  ) => {
    if (!product || !selectedVariant) {
      return;
    }

    const item = await addToCart({
      product,
      variant: selectedVariant,
      quantity: 1
    });

    if (item && destination === 'cart') {
      router.push('/cart');
    }
  };

  const productAvailable = Boolean(
    product &&
      selectedVariant &&
      selectedVariant.stockLeft > 0
  );

  return (
    <main className="min-h-dvh bg-zinc-950 px-3 py-4 text-white sm:px-6 sm:py-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/store"
          className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-white/70 backdrop-blur transition hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft className="size-4" />
          Back to Store
        </Link>

        <section className="mt-4 grid min-h-[calc(100dvh-7rem)] overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl lg:grid-cols-[minmax(0,1.15fr)_minmax(22rem,.85fr)]">
          <div className="relative min-h-[60dvh] overflow-hidden bg-black lg:min-h-0">
            <div
              aria-hidden="true"
              className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-amber-950 to-emerald-950"
            />

            <video
              src={reel.videoUrl}
              poster={reel.posterUrl ?? undefined}
              autoPlay={reel.autoplay}
              playsInline
              muted
              controls
              loop
              className="relative z-10 size-full object-contain"
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-black/90 via-black/30 to-transparent p-5 pt-20 sm:p-7 sm:pt-24 lg:hidden">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/80">
                {reel.vendorName ?? 'Shelsea Store Reel'}
              </p>

              <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-3xl">
                {reel.title}
              </h1>
            </div>
          </div>

          <aside className="min-h-0 overflow-y-auto border-t border-white/10 bg-zinc-950 p-5 sm:p-7 lg:border-l lg:border-t-0">
            <div className="hidden lg:block">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-300/80">
                {reel.vendorName ?? 'Shelsea Store Reel'}
              </p>

              <h1 className="mt-3 text-3xl font-black tracking-tight">
                {reel.title}
              </h1>
            </div>

            {reel.caption ? (
              <p className="mt-4 text-sm leading-6 text-white/60">
                {reel.caption}
              </p>
            ) : null}

            {product ? (
              <div className="mt-7 rounded-3xl border border-white/10 bg-white/5 p-4 sm:p-5">
                <div className="flex gap-4">
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl bg-white/10 sm:size-24">
                    {selectedVariant?.image ? (
                      <Image
                        src={selectedVariant.image}
                        alt={product.name}
                        fill
                        sizes="96px"
                        className="object-cover"
                      />
                    ) : (
                      <ShoppingBag className="absolute inset-0 m-auto size-6 text-white/35" />
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
                      Shop this Reel
                    </p>

                    <h2 className="mt-1 line-clamp-2 text-base font-black">
                      {product.name}
                    </h2>

                    {selectedVariant ? (
                      <p className="mt-2 text-lg font-black text-amber-300">
                        {money.format(selectedVariant.price)}
                      </p>
                    ) : null}
                  </div>
                </div>

                {product.shortDescription ? (
                  <p className="mt-4 text-xs leading-5 text-white/55">
                    {product.shortDescription}
                  </p>
                ) : null}

                {product.variants.length > 1 ? (
                  <div className="mt-5">
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
                      Choose an option
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
                      {product.variants.map(variant => {
                        const selected =
                          selectedVariant?.id === variant.id;

                        return (
                          <button
                            key={variant.id}
                            type="button"
                            onClick={() =>
                              setSelectedVariantId(variant.id)
                            }
                            disabled={variant.stockLeft <= 0}
                            className={cn(
                              'inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-[10px] font-bold transition disabled:cursor-not-allowed disabled:opacity-35',
                              selected
                                ? 'border-amber-300 bg-amber-300 text-black'
                                : 'border-white/15 bg-white/5 text-white hover:bg-white/10'
                            )}
                          >
                            {selected ? (
                              <Check className="size-3" />
                            ) : null}
                            {variant.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ) : null}

                <div className="mt-6 grid gap-2 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => void addSelectedProduct('stay')}
                    disabled={!productAvailable || mutating}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 text-xs font-bold text-white transition hover:bg-white/10 disabled:opacity-40"
                  >
                    <ShoppingCart className="size-4" />
                    Add to cart
                  </button>

                  <button
                    type="button"
                    onClick={() => void addSelectedProduct('cart')}
                    disabled={!productAvailable || mutating}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-black transition hover:bg-white/90 disabled:opacity-40"
                  >
                    <Sparkles className="size-4" />
                    Buy now
                  </button>
                </div>

                {!productAvailable ? (
                  <p className="mt-3 text-[10px] text-amber-300/70">
                    This option is currently unavailable.
                  </p>
                ) : null}
              </div>
            ) : reel.action ? (
              <Link
                href={reel.action.href}
                className="mt-7 inline-flex h-11 w-full items-center justify-center gap-2 rounded-full bg-white px-4 text-xs font-bold text-black"
              >
                <ShoppingBag className="size-4" />
                {reel.action.label}
              </Link>
            ) : null}

            <div className="mt-7 rounded-3xl border border-white/10 bg-white/[0.03] p-4 text-[10px] leading-5 text-white/40">
              This Reel is a Store Studio commerce experience. Product availability and pricing are resolved from the live Shelsea catalog.
            </div>
          </aside>
        </section>
      </div>
    </main>
  );
}
