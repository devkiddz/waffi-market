'use client';

import Image from 'next/image';
import Link from 'next/link';

import {
  ArrowLeft,
  Grid2X2,
  Sparkles
} from 'lucide-react';

import {
  useMemo
} from 'react';

import {
  useParams,
  useSearchParams
} from 'next/navigation';

import {
  useCatalog
} from '@/features/catalog';

import type {
  CategoryType,
  ProductType
} from '@/types/types';

import {
  ListingProductGrid
} from './ListingProductGrid';

function formatListingTitle(
  value: string
): string {
  return value
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(
      /\b\w/g,
      letter =>
        letter.toUpperCase()
    );
}

function productSubcategory(
  product: ProductType
): string {
  return (
    product.subcategory ??
    ''
  )
    .trim()
    .toLowerCase();
}

function productCategory(
  product: ProductType
): string {
  return (
    product.category ??
    ''
  )
    .trim()
    .toLowerCase();
}

function resolveEditorialProducts(
  key: string,
  products: ProductType[]
): ProductType[] | null {
  const normalizedKey =
    key
      .trim()
      .toLowerCase();

  const subcategoryIn = (
    product: ProductType,
    values: string[]
  ): boolean =>
    values.includes(
      productSubcategory(
        product
      )
    );

  switch (
    normalizedKey
  ) {
    case 'style-for-everyone':
      return products.filter(
        product =>
          subcategoryIn(
            product,
            [
              'women',
              'men',
              'kids',
              'unisex'
            ]
          )
      );

    case 'for-her':
      return products.filter(
        product =>
          productSubcategory(
            product
          ) ===
          'women'
      );

    case 'for-him':
      return products.filter(
        product =>
          productSubcategory(
            product
          ) ===
          'men'
      );

    case 'little-style':
      return products.filter(
        product =>
          productSubcategory(
            product
          ) ===
          'kids'
      );

    case 'nightwear-and-intimates':
    case 'nightwear-intimates':
      return products.filter(
        product =>
          subcategoryIn(
            product,
            [
              'lingerie',
              'nightwear',
              'underwear-basics',
              'socks-hosiery'
            ]
          )
      );

    case 'crown-and-scent':
    case 'crown-scent':
      return products.filter(
        product =>
          [
            'hair',
            'perfumes'
          ].includes(
            productCategory(
              product
            )
          )
      );

    case 'the-finishing-touch':
    case 'finishing-touch':
      return products.filter(
        product =>
          productCategory(
            product
          ) ===
          'apparel-accessories'
      );

    case 'the-date-night-edit':
    case 'date-night-edit':
      return products.filter(
        product =>
          productCategory(
            product
          ) ===
            'perfumes' ||
          subcategoryIn(
            product,
            [
              'women',
              'men',
              'lingerie',
              'nightwear',
              'bags',
              'shoes',
              'jewelry',
              'watches',
              'fashion-accessories'
            ]
          )
      );

    default:
      return null;
  }
}

function orderByIds(
  products: ProductType[],
  ids: string[]
): ProductType[] {
  const productMap =
    new Map(
      products.map(
        product => [
          String(
            product.id
          ),
          product
        ]
      )
    );

  return ids
    .map(
      id =>
        productMap.get(
          String(
            id
          )
        )
    )
    .filter(
      (
        product
      ): product is ProductType =>
        Boolean(
          product
        )
    );
}

function resolveDominantCategory(
  products: ProductType[],
  categories: CategoryType[]
): CategoryType | undefined {
  const frequency =
    new Map<
      string,
      number
    >();

  for (
    const product of
      products
  ) {
    const slug =
      productCategory(
        product
      );

    if (!slug) {
      continue;
    }

    frequency.set(
      slug,
      (
        frequency.get(
          slug
        ) ?? 0
      ) + 1
    );
  }

  const dominantSlug =
    Array.from(
      frequency.entries()
    )
      .sort(
        (
          first,
          second
        ) =>
          second[1] -
          first[1]
      )[0]?.[0];

  return dominantSlug
    ? categories.find(
        category =>
          category.slug ===
          dominantSlug
      )
    : undefined;
}

function stableIndex(
  value: string,
  length: number
): number {
  if (
    length <= 1
  ) {
    return 0;
  }

  return (
    Array.from(
      value
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
    length
  );
}

function resolveCategoryHeroImage(
  category:
    | CategoryType
    | undefined,
  key: string
): string | undefined {
  if (!category) {
    return undefined;
  }

  const images =
    Array.from(
      new Set(
        [
          ...(category.coverImages ??
            []),
          category.image
        ].filter(
          (
            image
          ): image is string =>
            Boolean(
              image
            )
        )
      )
    );

  if (
    images.length ===
    0
  ) {
    return undefined;
  }

  return images[
    stableIndex(
      key,
      images.length
    )
  ];
}

/* SHELSEA_GRID_CATEGORY_COVER_HERO_FINAL_V1 */

export function StoreListingPage() {
  const params =
    useParams<{
      key: string;
    }>();

  const searchParams =
    useSearchParams();

  const {
    products,
    categories,
    loading,
    error
  } =
    useCatalog();

  const key =
    typeof params.key ===
    'string'
      ? params.key
      : 'products';

  const title =
    searchParams.get(
      'title'
    ) ??
    formatListingTitle(
      key
    );

  const subtitle =
    searchParams.get(
      'subtitle'
    );

  const categorySlug =
    searchParams.get(
      'category'
    );

  const source =
    searchParams.get(
      'source'
    );

  const requestedIds =
    useMemo(
      () =>
        (
          searchParams.get(
            'ids'
          ) ??
          ''
        )
          .split(',')
          .map(
            value =>
              value.trim()
          )
          .filter(
            Boolean
          ),
      [
        searchParams
      ]
    );

  const resolvedProducts =
    useMemo(
      () => {
        const editorial =
          resolveEditorialProducts(
            key,
            products
          );

        if (
          editorial
        ) {
          return editorial;
        }

        const normalizedCategory =
          categorySlug
            ?.trim()
            .toLowerCase();

        const categoryPool =
          normalizedCategory &&
          normalizedCategory !==
            'all'
            ? products.filter(
                product =>
                  productCategory(
                    product
                  ) ===
                    normalizedCategory ||
                  productSubcategory(
                    product
                  ) ===
                    normalizedCategory
              )
            : products;

        if (
          key ===
          'special-picks'
        ) {
          return [
            ...categoryPool
          ].sort(
            (
              first,
              second
            ) => {
              const featuredDifference =
                Number(
                  second.featured
                ) -
                Number(
                  first.featured
                );

              if (
                featuredDifference !==
                0
              ) {
                return featuredDifference;
              }

              const ratingDifference =
                second.rating -
                first.rating;

              if (
                ratingDifference !==
                0
              ) {
                return ratingDifference;
              }

              return (
                second.soldCount -
                first.soldCount
              );
            }
          );
        }

        if (
          key ===
            'more-discoveries' ||
          key ===
            'category' ||
          (
            normalizedCategory &&
            normalizedCategory !==
              'all'
          )
        ) {
          return categoryPool;
        }

        if (
          requestedIds.length >
          0
        ) {
          return orderByIds(
            products,
            requestedIds
          );
        }

        const keyCategory =
          categories.find(
            category =>
              category.slug ===
              key
          );

        if (
          keyCategory
        ) {
          return products.filter(
            product =>
              productCategory(
                product
              ) ===
              keyCategory.slug
          );
        }

        return categoryPool;
      },
      [
        categorySlug,
        categories,
        key,
        products,
        requestedIds
      ]
    );

  const directCategory =
    categorySlug &&
    categorySlug !==
      'all'
      ? categories.find(
          category =>
            category.slug ===
            categorySlug
        )
      : categories.find(
          category =>
            category.slug ===
            key
        );

  const heroCategory =
    directCategory ??
    resolveDominantCategory(
      resolvedProducts,
      categories
    );

  const heroImage =
    resolveCategoryHeroImage(
      heroCategory,
      `${key}:${categorySlug ?? 'all'}`
    );

  const heroCategoryLabel =
    heroCategory?.label;

  return (
    <main
      className="
        min-w-0
        px-[var(--app-page-gutter)]
        pb-24 pt-5
        sm:pt-7
      ">
      <section
        className="
          relative mb-6
          min-h-52
          overflow-hidden
          rounded-[2rem]
          border
          border-rose-500/20
          bg-card
          px-4 py-5
          shadow-[0_20px_55px_rgba(76,5,25,0.10)]
          sm:min-h-60
          sm:px-6 sm:py-7
        ">
        {heroImage ? (
          <>
            <Image
              src={
                heroImage
              }
              alt=""
              fill
              priority
              sizes="100vw"
              className="
                absolute inset-0
                object-cover
                object-center
              "
            />

            <div
              aria-hidden="true"
              className="
                absolute inset-0
                bg-gradient-to-r
                from-background
                via-background/90
                to-background/34
                dark:from-background/95
                dark:via-background/78
                dark:to-background/20
              "
            />

            <div
              aria-hidden="true"
              className="
                absolute inset-x-0
                bottom-0 h-32
                bg-gradient-to-t
                from-background/92
                to-transparent
              "
            />
          </>
        ) : null}

        <div
          aria-hidden="true"
          className="
            absolute inset-x-0
            top-0 z-10 h-0.5
            bg-gradient-to-r
            from-rose-500
            via-rose-400
            to-amber-300
          "
        />

        <div
          className="
            relative z-20
            flex min-h-40
            flex-wrap
            items-end
            justify-between
            gap-4
          ">
          <div className="min-w-0 max-w-3xl">
            <Link
              href="/store"
              className="
                inline-flex
                items-center gap-1.5
                rounded-full
                bg-background/72
                px-2.5 py-1.5
                text-xs font-semibold
                text-muted-foreground
                backdrop-blur-md
                transition
                hover:text-rose-500
              ">
              <ArrowLeft className="size-3.5" />
              Back to Store
            </Link>

            <div
              className="
                mt-5 inline-flex
                items-center gap-2
                rounded-full
                border border-rose-500/22
                bg-background/72
                px-3 py-1.5
                text-[0.62rem]
                font-bold uppercase
                tracking-[0.16em]
                text-rose-500
                backdrop-blur-md
              ">
              <Sparkles className="size-3.5" />

              {heroCategoryLabel ??
                'Shelsea selection'}
            </div>

            <h1
              className="
                mt-3
                text-2xl font-black
                tracking-[-0.035em]
                text-foreground
                sm:text-3xl
                lg:text-4xl
              ">
              {title}
            </h1>

            {subtitle ? (
              <p
                className="
                  mt-2 max-w-2xl
                  text-sm leading-6
                  text-muted-foreground
                ">
                {subtitle}
              </p>
            ) : heroCategoryLabel ? (
              <p
                className="
                  mt-2 max-w-2xl
                  text-sm leading-6
                  text-muted-foreground
                ">
                Explore the complete{' '}
                {heroCategoryLabel}{' '}
                selection.
              </p>
            ) : (
              <p
                className="
                  mt-2 max-w-2xl
                  text-sm leading-6
                  text-muted-foreground
                ">
                Explore every product currently available in this Shelsea selection.
              </p>
            )}
          </div>

          <div
            className="
              inline-flex
              items-center gap-2
              rounded-2xl
              border border-rose-500/16
              bg-background/78
              px-3 py-2
              text-xs font-semibold
              text-muted-foreground
              shadow-sm
              backdrop-blur-md
            ">
            <Grid2X2 className="size-4 text-rose-500" />

            {loading
              ? 'Loading…'
              : `${resolvedProducts.length} ${
                  resolvedProducts.length ===
                  1
                    ? 'product'
                    : 'products'
                }`}
          </div>
        </div>

        {source ? (
          <p
            className="
              relative z-20
              mt-4
              text-[0.62rem]
              font-semibold uppercase
              tracking-[0.14em]
              text-muted-foreground/70
            ">
            Shelsea discovery ·{' '}
            {formatListingTitle(
              source
            )}
          </p>
        ) : null}
      </section>

      {error ? (
        <div
          className="
            mb-5 rounded-2xl
            border border-destructive/20
            bg-destructive/5
            px-4 py-3
            text-sm text-destructive
          ">
          {error}
        </div>
      ) : null}

      {loading ? (
        <div
          className="
            grid grid-cols-2
            gap-3
            sm:grid-cols-3
            lg:grid-cols-4
          ">
          {Array.from({
            length: 10
          }).map(
            (
              _,
              index
            ) => (
              <div
                key={
                  index
                }
                className="
                  aspect-[4/6]
                  animate-pulse
                  rounded-2xl
                  bg-muted
                "
              />
            )
          )}
        </div>
      ) : (
        <ListingProductGrid
          products={
            resolvedProducts
          }
        />
      )}
    </main>
  );
}
