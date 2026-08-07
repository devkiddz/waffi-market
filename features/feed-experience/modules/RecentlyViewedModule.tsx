'use client';

import {
  ProductCard
} from '@/features/products/cards';

import {
  EXPERIENCE_PRODUCT_ITEM_CLASS,
  EXPERIENCE_PRODUCT_RAIL_CLASS
} from '@/features/products/productRailPresentation';

import {
  ListingViewAllLink,
  buildStoreListingHref
} from '@/features/store-listings';

import type {
  FeedActions,
  RecentlyViewedModule as RecentlyViewedModuleType
} from '../contracts';

type RecentlyViewedModuleProps = {
  module: RecentlyViewedModuleType;
  actions: FeedActions;
};

export function RecentlyViewedModule({
  module,
  actions
}: RecentlyViewedModuleProps) {
  const {
    title,
    subtitle,
    products
  } =
    module.data;

  if (
    !products.length
  ) {
    return null;
  }

  const viewAllHref =
    buildStoreListingHref({
      title,
      subtitle,
      key:
        'recently-viewed',
      moduleId:
        module.id,
      source:
        'recently-viewed',
      productIds:
        products.map(
          product =>
            product.id
        )
    });

  return (
    <section className="space-y-4">
      <header
        className="
          flex min-w-0
          items-start
          justify-between
          gap-4
        ">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold">
            {title}
          </h2>

          {subtitle ? (
            <p className="mt-1 text-sm text-muted-foreground">
              {subtitle}
            </p>
          ) : null}
        </div>

        <ListingViewAllLink
          href={
            viewAllHref
          }
        />
      </header>

      <div
        className={
          EXPERIENCE_PRODUCT_RAIL_CLASS
        }>
        {products.map(
          product => (
            <div
              key={
                product.id
              }
              data-experience-product-item
              className={
                EXPERIENCE_PRODUCT_ITEM_CLASS
              }>
              <ProductCard
                product={
                  product
                }
                onPreview={
                  actions.previewProduct
                }
                onToggleLike={
                  actions.toggleLike
                }
                onAddToCart={
                  actions.addToCart
                }
              />
            </div>
          )
        )}
      </div>
    </section>
  );
}
