'use client';

import { useMemo, useState, type ReactNode } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import {
  ArrowLeft,
  Check,
  Heart,
  PackageCheck,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sparkles,
  Star,
  Truck
} from 'lucide-react';

import { useCart } from '@/features/cart';
import { openCustomerProductExperience } from '@/features/customer-experience';
import { useWishlist } from '@/features/wishlist';
import { cn } from '@/lib/utils';
import type { ProductType, ProductVariantType } from '@/types/types';

import ProductShelf from './ProductShelf';

const money = new Intl.NumberFormat('en-NG', {
  style: 'currency',
  currency: 'NGN',
  maximumFractionDigits: 0
});

type StoreProductDetailExperienceProps = {
  product: ProductType;
  gallery: string[];
  relatedProducts: ProductType[];
};

export function StoreProductDetailExperience({
  product,
  gallery,
  relatedProducts
}: StoreProductDetailExperienceProps) {
  const router = useRouter();
  const { addToCart, mutating } = useCart();
  const { toggleWishlist, isWishlisted, isMutating } = useWishlist();

  const firstAvailableVariant = useMemo(
    () =>
      product.variants.find(variant => variant.stockLeft > 0) ??
      product.variants[0] ??
      null,
    [product.variants]
  );

  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    firstAvailableVariant?.id ?? null
  );
  const [selectedMedia, setSelectedMedia] = useState(
    gallery[0] ?? firstAvailableVariant?.image ?? '/placeholder.svg'
  );

  const selectedVariant = useMemo(
    () =>
      product.variants.find(variant => variant.id === selectedVariantId) ??
      firstAvailableVariant,
    [firstAvailableVariant, product.variants, selectedVariantId]
  );

  const available = Boolean(selectedVariant && selectedVariant.stockLeft > 0);
  const wished = isWishlisted(product.id);

  const selectVariant = (variant: ProductVariantType) => {
    setSelectedVariantId(variant.id);

    if (variant.image) {
      setSelectedMedia(variant.image);
    }
  };

  const addSelected = async (destination: 'stay' | 'cart') => {
    if (!selectedVariant || selectedVariant.stockLeft <= 0) {
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

  const addRelatedProduct = (
    relatedProduct: ProductType,
    variant: ProductVariantType
  ) => {
    void addToCart({
      product: relatedProduct,
      variant,
      quantity: 1
    });
  };

  return (
    <main className="min-h-dvh bg-background px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <Link
          href="/store"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to Store
        </Link>

        <section className="mt-5 grid overflow-hidden rounded-[2rem] border border-border/60 bg-card shadow-xl lg:grid-cols-[minmax(0,1.05fr)_minmax(24rem,0.95fr)]">
          <div className="border-b border-border/60 bg-muted/20 p-3 sm:p-5 lg:border-b-0 lg:border-r">
            <div className="relative aspect-square overflow-hidden rounded-3xl bg-background">
              <Image
                src={selectedMedia}
                alt={product.name}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 52vw"
                className="object-contain p-4 sm:p-8"
              />

              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                {product.discountPercentage > 0 ? (
                  <span className="rounded-full bg-rose-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-lg">
                    -{product.discountPercentage}%
                  </span>
                ) : null}

                {product.isNew ? (
                  <span className="rounded-full bg-emerald-600 px-3 py-1.5 text-[10px] font-bold text-white shadow-lg">
                    New
                  </span>
                ) : null}

                {product.featured ? (
                  <span className="rounded-full bg-amber-400 px-3 py-1.5 text-[10px] font-bold text-black shadow-lg">
                    Featured
                  </span>
                ) : null}
              </div>
            </div>

            {gallery.length > 1 ? (
              <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-1 scrollbar-none">
                {gallery.map(media => (
                  <button
                    key={media}
                    type="button"
                    onClick={() => setSelectedMedia(media)}
                    aria-label="View product image"
                    className={cn(
                      'relative size-16 shrink-0 snap-start overflow-hidden rounded-2xl border bg-background transition sm:size-20',
                      selectedMedia === media
                        ? 'border-primary ring-2 ring-primary/15'
                        : 'border-border/60 hover:border-primary/30'
                    )}
                  >
                    <Image
                      src={media}
                      alt=""
                      fill
                      sizes="80px"
                      className="object-contain p-1.5"
                    />
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="p-5 sm:p-7 lg:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-primary/70">
                  {product.category.replaceAll('-', ' ')}
                  {product.subcategory ? ` · ${product.subcategory.replaceAll('-', ' ')}` : ''}
                </p>

                <h1 className="mt-2 text-2xl font-black tracking-tight sm:text-4xl">
                  {product.name}
                </h1>

                {product.merchant ? (
                  <Link
                    href={`/vendors/${encodeURIComponent(product.merchant.slug)}`}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition hover:text-primary">
                    Sold by {product.merchant.name}
                  </Link>
                ) : null}
              </div>

              <button
                type="button"
                onClick={() => void toggleWishlist({ id: product.id, name: product.name })}
                disabled={isMutating(product.id)}
                aria-label={wished ? 'Remove from wishlist' : 'Save to wishlist'}
                className={cn(
                  'grid size-11 shrink-0 place-items-center rounded-full border transition disabled:opacity-50',
                  wished
                    ? 'border-rose-500/30 bg-rose-500/10 text-rose-600'
                    : 'border-border/70 bg-background text-muted-foreground hover:text-foreground'
                )}
              >
                <Heart className={cn('size-5', wished && 'fill-current')} />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1 font-bold text-foreground">
                <Star className="size-4 fill-amber-400 text-amber-400" />
                {product.rating.toFixed(1)}
              </span>
              <span>{product.reviews.toLocaleString('en-NG')} reviews</span>
              <span>{product.soldCount.toLocaleString('en-NG')} sold</span>
            </div>

            {product.shortDescription ? (
              <p className="mt-5 text-sm leading-6 text-muted-foreground">
                {product.shortDescription}
              </p>
            ) : null}

            <div className="mt-6 rounded-3xl border border-border/60 bg-muted/25 p-4 sm:p-5">
              {selectedVariant ? (
                <div className="flex flex-wrap items-end justify-between gap-3">
                  <div>
                    <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                      Selected option
                    </p>
                    <p className="mt-1 text-sm font-bold">{selectedVariant.label}</p>
                  </div>

                  <p className="text-2xl font-black text-primary sm:text-3xl">
                    {money.format(selectedVariant.price)}
                  </p>
                </div>
              ) : (
                <p className="text-sm font-bold">No purchasable options are available.</p>
              )}

              {product.variants.length ? (
                <div className="mt-5 flex flex-wrap gap-2">
                  {product.variants.map(variant => {
                    const selected = selectedVariant?.id === variant.id;

                    return (
                      <button
                        key={variant.id}
                        type="button"
                        onClick={() => selectVariant(variant)}
                        disabled={variant.stockLeft <= 0}
                        className={cn(
                          'inline-flex min-h-10 items-center gap-2 rounded-full border px-4 text-xs font-bold transition disabled:cursor-not-allowed disabled:opacity-35',
                          selected
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border/70 bg-background hover:border-primary/30'
                        )}
                      >
                        {selected ? <Check className="size-3.5" /> : null}
                        {variant.label}
                        <span className="text-[9px] opacity-70">
                          {variant.stockLeft > 0 ? `${variant.stockLeft} left` : 'Out'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ) : null}

              <div className="mt-6 grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => void addSelected('stay')}
                  disabled={!available || mutating}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border/70 bg-background px-5 text-sm font-bold transition hover:bg-muted disabled:opacity-40"
                >
                  <ShoppingCart className="size-4" />
                  Add to cart
                </button>

                <button
                  type="button"
                  onClick={() => void addSelected('cart')}
                  disabled={!available || mutating}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-bold text-background transition hover:opacity-90 disabled:opacity-40"
                >
                  <Sparkles className="size-4" />
                  Buy now
                </button>
              </div>

              {!available ? (
                <p className="mt-3 text-xs font-semibold text-amber-700 dark:text-amber-300">
                  This option is currently unavailable.
                </p>
              ) : null}
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-3">
              <ConfidenceItem icon={<Truck />} label={product.estimatedDelivery} />
              <ConfidenceItem icon={<ShieldCheck />} label="Secure checkout" />
              <ConfidenceItem icon={<PackageCheck />} label="Live inventory" />
            </div>

            {product.longDescription ? (
              <details className="group mt-5 rounded-2xl border border-border/60 bg-background/60 p-4" open>
                <summary className="cursor-pointer list-none text-sm font-black">
                  Product details
                </summary>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted-foreground">
                  {product.longDescription}
                </p>
              </details>
            ) : null}
          </div>
        </section>

        {relatedProducts.length ? (
          <section className="mt-8 rounded-[2rem] border border-border/60 bg-card/70 p-4 shadow-sm sm:p-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-primary/70">
                  Continue discovering
                </p>
                <h2 className="mt-1 text-xl font-black sm:text-2xl">Related products</h2>
              </div>
              <ShoppingBag className="size-5 text-muted-foreground" />
            </div>

            <ProductShelf
              products={relatedProducts}
              ariaLabel="Related products"
              className="mt-5"
              onOpenExperience={related =>
                openCustomerProductExperience({
                  id: related.id,
                  name: related.name,
                  shortDescription: related.shortDescription
                })
              }
              onPreview={related =>
                openCustomerProductExperience({
                  id: related.id,
                  name: related.name,
                  shortDescription: related.shortDescription
                })
              }
              onAddToCart={addRelatedProduct}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}

function ConfidenceItem({
  icon,
  label
}: {
  icon: ReactNode;
  label: string;
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-2xl border border-border/60 bg-background/60 p-3">
      <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary [&_svg]:size-4">
        {icon}
      </span>
      <span className="line-clamp-2 text-[10px] font-semibold leading-4">{label}</span>
    </div>
  );
}
