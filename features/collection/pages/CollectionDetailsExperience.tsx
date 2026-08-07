'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback } from 'react';

import { ArrowLeft, FolderKanban, LoaderCircle } from 'lucide-react';

import { useActionFeedback } from '@/features/action-feedback';
import { useCart } from '@/features/cart';
import { useCatalog } from '@/features/catalog';
import { openCustomerProductExperience } from '@/features/customer-experience';
import { ProductCard } from '@/features/products/cards';

import type { ProductType, ProductVariantType } from '@/types/types';

import { resolveCollectionProducts } from '../collectionCatalog';
import CollectionProductsHeader from '../components/CollectionProductsHeader';

type CollectionDetailsExperienceProps = {
  slug: string;
};

export default function CollectionDetailsExperience({
  slug
}: CollectionDetailsExperienceProps) {
  const {
    collections, products, loading, error,
    categories
  } = useCatalog();
  const { addToCart } = useCart();
  const { error: showError } = useActionFeedback();

  const normalizedSlug = decodeURIComponent(slug).trim().toLowerCase();
  const collection = collections.find(
    item => item.slug.trim().toLowerCase() === normalizedSlug
  );

  const collectionProducts = collection
    ? resolveCollectionProducts(collection, products)
    : [];

/* SHELSEA_CATEGORY_COLLECTION_HERO_V1 */
  const categoryFrequency =
    new Map<
      string,
      number
    >();

  for (
    const product of
      collectionProducts
  ) {
    const categorySlug =
      product.category
        .trim()
        .toLowerCase();

    categoryFrequency.set(
      categorySlug,
      (
        categoryFrequency.get(
          categorySlug
        ) ?? 0
      ) + 1
    );
  }

  const dominantCategorySlug =
    Array.from(
      categoryFrequency.entries()
    )
      .sort(
        (
          first,
          second
        ) =>
          second[1] -
          first[1]
      )[0]?.[0];

  const heroCategory =
    dominantCategorySlug
      ? categories.find(
          category =>
            category.slug
              .trim()
              .toLowerCase() ===
            dominantCategorySlug
        )
      : undefined;

  const categoryHeroImages =
    [
      ...(heroCategory?.coverImages ??
        []),
      heroCategory?.image
    ].filter(
      (
        image
      ): image is string =>
        Boolean(
          image
        )
    );

  const collectionHeroIndex =
    collection &&
    categoryHeroImages.length >
      0
      ? Array.from(
          collection.slug
        ).reduce(
          (
            total,
            character
          ) =>
            total +
            character.charCodeAt(
              0
            ),
          0
        ) %
        categoryHeroImages.length
      : 0;

  const collectionHeroImage =
    categoryHeroImages[
      collectionHeroIndex
    ] ??
    collection?.banner?.image;

  const openProduct = useCallback((product: ProductType): void => {
    openCustomerProductExperience({
      id: String(product.id),
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
            description: 'Shelsea could not add this product to your cart. Please try again.'
          });
        }
      });
    },
    [addToCart, showError]
  );

  if (loading) {
    return (
      <main className="grid min-h-[60dvh] place-items-center px-4">
        <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin" />
          Loading collection
        </div>
      </main>
    );
  }

  if (!collection || collectionProducts.length === 0) {
    return (
      <main className="mx-auto grid min-h-[70dvh] w-full max-w-4xl place-items-center px-4 py-10 text-center">
        <div className="rounded-[2rem] border border-dashed border-border/70 bg-card/60 p-10">
          <FolderKanban className="mx-auto size-9 text-muted-foreground" />
          <h1 className="mt-4 text-2xl font-bold">Collection unavailable</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">
            This collection may be paused, unpublished, expired or no longer contain available products.
          </p>
          {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
          <Link
            href="/collections"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-xs font-bold text-background">
            <ArrowLeft className="size-3.5" />
            Browse Collections
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[96rem] px-3 py-5 sm:px-5 sm:py-8 lg:px-7">
      <Link
        href="/collections"
        className="mb-4 inline-flex h-9 items-center gap-2 rounded-full border border-border/70 bg-card/70 px-3 text-xs font-bold text-muted-foreground transition hover:text-foreground">
        <ArrowLeft className="size-3.5" />
        All Collections
      </Link>

      <article className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 shadow-xl">
        {collectionHeroImage ? (
          <div className="relative aspect-[16/5] min-h-44 w-full overflow-hidden bg-muted sm:min-h-56">
            <Image
              src={collectionHeroImage}
              alt={`${collection.title} collection cover`}
              fill
              priority
              sizes="(max-width: 768px) 100vw, 1500px"
              className="object-cover object-center"
            />

            <div
              data-shelsea-collection-hero-overlay
              aria-hidden="true"
              className="
                absolute inset-0
                bg-gradient-to-r
                from-[#081224]/78
                via-[#081224]/28
                to-transparent
              "
            />

            <div
              className="
                absolute
                bottom-4 left-4
                max-w-[82%]
                sm:bottom-6 sm:left-6
              "
            >
              <span
                className="
                  inline-flex
                  rounded-full
                  border border-white/20
                  bg-black/30
                  px-3 py-1.5
                  text-[10px]
                  font-bold uppercase
                  tracking-[0.16em]
                  text-[#F3E2BA]
                  backdrop-blur-xl
                "
              >
                {heroCategory?.label ??
                  'Shelsea Collection'}
              </span>

              <p
                className="
                  mt-2
                  line-clamp-1
                  text-xl
                  font-black
                  tracking-tight
                  text-white
                  drop-shadow
                  sm:text-3xl
                "
              >
                {collection.title}
              </p>
            </div>
          </div>
        ) : null}

        <div className="p-4 sm:p-6">
          <CollectionProductsHeader
            title={collection.title}
            subtitle={collection.subtitle}
            productCount={collectionProducts.length}
          />

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:gap-4 xl:grid-cols-4 2xl:grid-cols-5">
            {collectionProducts.map(product => (
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
        </div>
      </article>
    </main>
  );
}
