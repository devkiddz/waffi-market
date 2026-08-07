'use client';

/* AJ_FEATURED_MODULE_UNIFICATION_V1 */

import {
  Fragment,
  useMemo
} from 'react';

import type {
  FeedModule,
  FeaturedProductsModule
} from '../contracts';

import type {
  ProductType
} from '@/types/types';

import FeedExperienceLoader from '../providers/FeedExperienceLoader';

import {
  useFeedExperienceContext
} from '../providers/FeedExperienceProvider';

import {
  FeedModuleRenderer
} from './FeedModuleRenderer';

const PUBLIC_SHOPPING_LIST_SLOT_ID =
  'public-shopping-list-feed-slot';

const AMBIENT_DISCOVERY_MODULE_TYPES =
  new Set<
    FeedModule['type']
  >([
    'shopping-journey',
    'collection-feed',
    'featured-products',
    'product-grid',
    'recently-viewed',
    'product-rail'
  ]);

function uniqueProducts(
  products: ProductType[]
): ProductType[] {
  return Array.from(
    new Map(
      products.map(
        product => [
          product.id,
          product
        ]
      )
    ).values()
  );
}

function isFeaturedProductsModule(
  module: FeedModule
): module is FeaturedProductsModule {
  return module.type ===
    'featured-products';
}

function unifyFeaturedProductModules(
  modules: FeedModule[]
): FeedModule[] {
  const featuredModules =
    modules.filter(
      isFeaturedProductsModule
    );

  if (
    featuredModules.length <=
    1
  ) {
    return modules;
  }

  const firstFeaturedIndex =
    modules.findIndex(
      isFeaturedProductsModule
    );

  const firstModule =
    featuredModules[0];

  const combinedFeaturedProducts =
    uniqueProducts(
      featuredModules.flatMap(
        module => [
          ...(module.data.featuredProduct
            ? [
                module.data.featuredProduct
              ]
            : []),
          ...module.data.featuredProducts
        ]
      )
    );

  const combinedProducts =
    uniqueProducts(
      featuredModules.flatMap(
        module => [
          ...(module.data.products ?? []),
          ...(module.data.featuredProduct
            ? [
                module.data.featuredProduct
              ]
            : []),
          ...module.data.featuredProducts
        ]
      )
    );

  const categorySlugs =
    new Set(
      featuredModules
        .map(
          module =>
            module.data.categorySlug
        )
        .filter(
          (
            value
          ): value is string =>
            Boolean(
              value
            )
        )
    );

  const unifiedModule:
    FeaturedProductsModule = {
      id:
        `featured-products:unified:${featuredModules
          .map(
            module =>
              module.id
          )
          .join('|')}`,

      type:
        'featured-products',

      priority:
        Math.max(
          ...featuredModules.map(
            module =>
              module.priority
          )
        ),

      data: {
        title:
          featuredModules.find(
            module =>
              module.data.title
          )?.data.title ??
          'Featured across Shelsea',

        subtitle:
          featuredModules.find(
            module =>
              module.data.subtitle
          )?.data.subtitle,

        categorySlug:
          categorySlugs.size ===
          1
            ? [
                ...categorySlugs
              ][0]
            : 'all',

        featuredProduct:
          firstModule.data.featuredProduct ??
          combinedFeaturedProducts[0],

        featuredProducts:
          combinedFeaturedProducts,

        products:
          combinedProducts,

        locale:
          firstModule.data.locale,

        currency:
          firstModule.data.currency
      }
    };

  return modules.flatMap<FeedModule>(
    (
      module,
      index
    ): FeedModule[] => {
      if (
        !isFeaturedProductsModule(
          module
        )
      ) {
        return [
          module
        ];
      }

      return index ===
        firstFeaturedIndex
        ? [
            unifiedModule
          ]
        : [];
    }
  );
}

export function FeedRenderer() {
  const {
    experience,
    actions,
    isResolving,
    pendingIntent
  } = useFeedExperienceContext();

  const resolvedModules =
    useMemo(
      () =>
        unifyFeaturedProductModules(
          experience.modules
        ),
      [
        experience.modules
      ]
    );

  if (isResolving) {
    return (
      <main
        aria-busy="true"
        aria-live="polite"
      >
        <FeedExperienceLoader
          intentType={
            pendingIntent?.type
          }
        />
      </main>
    );
  }

  if (
    process.env.NODE_ENV ===
    'development'
  ) {
    console.table(
      resolvedModules.map(
        module => ({
          id:
            module.id,

          type:
            module.type,

          priority:
            module.priority
        })
      )
    );
  }

  const publicListInsertionIndex =
    resolvedModules.findIndex(
      module =>
        AMBIENT_DISCOVERY_MODULE_TYPES.has(
          module.type
        )
    );

  return (
    <main
      aria-busy="false"
      data-experience-key={
        experience.key
      }
      data-experience-status={
        experience.status
      }
    >
      <div className="space-y-4 md:space-y-5">
        {resolvedModules.map(
          (
            module,
            index
          ) => (
            <Fragment
              key={
                module.id
              }
            >
              {index ===
              publicListInsertionIndex ? (
                <div
                  id={
                    PUBLIC_SHOPPING_LIST_SLOT_ID
                  }
                  className="min-w-0"
                  data-feed-module="public-shopping-lists"
                />
              ) : null}

              <FeedModuleRenderer
                module={
                  module
                }
                actions={
                  actions
                }
              />
            </Fragment>
          )
        )}

        {publicListInsertionIndex ===
        -1 ? (
          <div
            id={
              PUBLIC_SHOPPING_LIST_SLOT_ID
            }
            className="min-w-0"
            data-feed-module="public-shopping-lists"
          />
        ) : null}
      </div>
    </main>
  );
}
