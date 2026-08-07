'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback } from 'react';

import { ArrowLeft, BadgeCheck, BadgePercent } from 'lucide-react';

import { useActionFeedback } from '@/features/action-feedback';
import { useCart } from '@/features/cart';
import { openCustomerProductExperience } from '@/features/customer-experience';
import { ProductCard } from '@/features/products/cards';

import type { ProductType, ProductVariantType } from '@/types/types';

import type { VendorPromotionDetail } from '../contracts';

export default function VendorPromotionExperience({
  detail
}: {
  detail: VendorPromotionDetail;
}) {
  const { addToCart } = useCart();
  const { error: showError } = useActionFeedback();

  const openProduct = useCallback((product: ProductType): void => {
    openCustomerProductExperience({
      id: product.id,
      name: product.name,
      shortDescription: product.shortDescription
    });
  }, []);

  const addProductToCart = useCallback(
    (product: ProductType, variant: ProductVariantType): void => {
      void addToCart({
        product,
        variant,
        quantity: 1
      }).then(addedItem => {
        if (!addedItem) {
          showError({
            title: 'Unable to add product',
            description:
              'Shelsea could not add this product to your cart. Please try again.'
          });
        }
      });
    },
    [addToCart, showError]
  );

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[96rem] px-3 py-5 sm:px-5 sm:py-8 lg:px-7">
      <Link
        href={`/shops/${encodeURIComponent(detail.vendor.slug)}`}
        className="mb-4 inline-flex h-9 items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 text-xs font-bold text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        Back to {detail.vendor.name}
      </Link>

      <section className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black shadow-2xl sm:min-h-[26rem]">
        {detail.promotion.imageUrl ? (
          <Image
            src={detail.promotion.imageUrl}
            alt={detail.promotion.title}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : null}

        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-black/15" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/80 to-transparent" />

        <div className="relative z-10 flex min-h-[22rem] max-w-3xl flex-col justify-end p-6 text-white sm:min-h-[26rem] sm:p-10">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur-xl">
              <BadgePercent className="size-3.5" />
              {detail.promotion.badge}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur-xl">
              <BadgeCheck className="size-3.5" />
              {detail.vendor.name}
            </span>
          </div>

          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-6xl">
            {detail.promotion.title}
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-white/75 sm:text-base">
            {detail.promotion.description ??
              'A verified merchant offer published through Shelsea.'}
          </p>
        </div>
      </section>

      <section className="mt-8">
        <div className="flex min-w-0 items-end justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[0.62rem] font-bold uppercase tracking-[0.18em] text-primary">
              Included selection
            </p>
            <h2 className="mt-1 truncate text-2xl font-black tracking-tight">
              Shop this offer
            </h2>
          </div>
          <span className="shrink-0 rounded-full border border-border/60 bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            {detail.products.length}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
          {detail.products.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onPreview={openProduct}
              onOpenExperience={openProduct}
              onAddToCart={addProductToCart}
              className="h-full"
            />
          ))}
        </div>
      </section>
    </main>
  );
}
