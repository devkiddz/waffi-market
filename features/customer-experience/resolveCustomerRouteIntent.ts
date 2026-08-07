import type {
  FeedIntent
} from '@/features/feed-experience/contracts';

import {
  getCustomerJourneyDefinition,
  isCustomerJourneySlug
} from './customerJourneyRoutes';

import {
  resolveCustomerSurface
} from './customerExperienceRoutes';

type SearchParamsReader = {
  get(name: string): string | null;
  toString(): string;
};

function buildRoute(
  pathname: string,
  searchParams: SearchParamsReader
): string {
  const query =
    searchParams.toString();

  return query
    ? `${pathname}?${query}`
    : pathname;
}

function routeTitle(
  surface: string
): string {
  switch (surface) {
    case 'home':
      return 'Shelsea home';

    case 'auth':
      return 'Account access';

    case 'store':
      return 'Store discovery';

    case 'account':
      return 'Customer dashboard';

    case 'cart':
      return 'Shopping cart';

    case 'orders':
      return 'Orders';

    case 'wishlist':
      return 'Wishlist';

    case 'rewards':
      return 'Rewards';

    case 'settings':
      return 'Settings';

    case 'checkout':
      return 'Checkout';

    case 'discover':
      return 'Discover';

    case 'ai':
      return 'AJ AI';

    case 'tracking':
      return 'Delivery tracking';

    case 'search':
      return 'Search';

    case 'product':
      return 'Product experience';

    case 'promotion':
      return 'Promotion';

    case 'collection':
      return 'Collections';

    case 'shop':
      return 'Merchant storefront';

    case 'reel':
      return 'Reel experience';

    default:
      return 'Shelsea experience';
  }
}

function resolveJourneySlug(
  pathname: string
): string | null {
  const prefix =
    '/account/journey/';

  if (
    !pathname.startsWith(
      prefix
    )
  ) {
    return null;
  }

  const segment =
    pathname
      .slice(prefix.length)
      .split('/')[0]
      ?.trim();

  if (!segment) {
    return null;
  }

  try {
    return decodeURIComponent(
      segment
    );
  } catch {
    return segment;
  }
}

export function resolveCustomerRouteIntent(
  pathname: string,
  searchParams: SearchParamsReader,
  createdAt =
    new Date().toISOString()
): FeedIntent {
  const route =
    buildRoute(
      pathname,
      searchParams
    );

  const surface =
    resolveCustomerSurface(
      pathname
    );

  const journeySlug =
    resolveJourneySlug(
      pathname
    );

  if (
    journeySlug &&
    isCustomerJourneySlug(
      journeySlug
    )
  ) {
    const definition =
      getCustomerJourneyDefinition(
        journeySlug
      );

    return {
      id:
        `route:${route}:journey:${journeySlug}`,

      type:
        'home',

      source:
        'route',

      categorySlug:
        'all',

      route,

      surface:
        'account',

      title:
        definition.historyTitle,

      subtitle:
        definition.historySubtitle,

      createdAt
    };
  }

  if (
    pathname === '/store' ||
    pathname.startsWith(
      '/store/'
    )
  ) {
    const productId =
      searchParams.get(
        'product'
      );

    const collectionId =
      searchParams.get(
        'collection'
      );

    const promotionId =
      searchParams.get(
        'promotion'
      );

    const query =
      searchParams.get('q') ??
      searchParams.get(
        'query'
      );

    const categorySlug =
      searchParams.get(
        'category'
      ) ?? 'all';

    if (productId) {
      return {
        id:
          `route:${route}:product:${productId}`,

        type:
          'product',

        source:
          'route',

        targetId:
          productId,

        categorySlug,

        route,

        surface,

        title:
          'Product experience',

        createdAt
      };
    }

    if (collectionId) {
      return {
        id:
          `route:${route}:collection:${collectionId}`,

        type:
          'collection',

        source:
          'route',

        targetId:
          collectionId,

        categorySlug,

        route,

        surface,

        title:
          'Collection experience',

        createdAt
      };
    }

    if (promotionId) {
      return {
        id:
          `route:${route}:promotion:${promotionId}`,

        type:
          'promotion',

        source:
          'route',

        targetId:
          promotionId,

        categorySlug,

        route,

        surface,

        title:
          'Promotion experience',

        createdAt
      };
    }

    if (query) {
      return {
        id:
          `route:${route}:search:${query}`,

        type:
          'search',

        source:
          'search',

        query,

        categorySlug,

        route,

        surface,

        title:
          `Search: ${query}`,

        createdAt
      };
    }

    return {
      id:
        `route:${route}:store:${categorySlug}`,

      type:
        'store-discovery',

      source:
        'route',

      categorySlug,

      route,

      surface,

      title:
        categorySlug ===
        'all'
          ? 'Store discovery'
          : `Browse ${categorySlug}`,

      createdAt
    };
  }

  if (
    pathname.startsWith(
      '/products/'
    )
  ) {
    const productId =
      decodeURIComponent(
        pathname.slice(
          '/products/'.length
        )
      );

    return {
      id:
        `route:${route}:product:${productId}`,

      type:
        'product',

      source:
        'route',

      targetId:
        productId,

      route,

      surface,

      title:
        'Product experience',

      createdAt
    };
  }

  if (
    pathname === '/shops' ||
    pathname.startsWith('/shops/')
  ) {
    const vendorSlug =
      pathname === '/shops'
        ? null
        : decodeURIComponent(
            pathname.slice('/shops/'.length).split('/')[0] ?? ''
          );

    return {
      id: vendorSlug
        ? `route:${route}:shop:${vendorSlug}`
        : `route:${route}:shops`,
      type: 'home',
      source: 'route',
      ...(vendorSlug ? { targetId: vendorSlug } : {}),
      route,
      surface,
      title: vendorSlug ? 'Merchant storefront' : 'Verified shops',
      createdAt
    };
  }

  if (
    pathname.startsWith(
      '/collections/'
    )
  ) {
    const collectionSlug =
      decodeURIComponent(
        pathname.slice(
          '/collections/'.length
        )
      );

    return {
      id:
        `route:${route}:collection:${collectionSlug}`,

      type:
        'collection',

      source:
        'route',

      targetId:
        collectionSlug,

      route,

      surface,

      title:
        'Collection experience',

      createdAt
    };
  }

  if (
    pathname.startsWith(
      '/promos/'
    )
  ) {
    const promotionId =
      decodeURIComponent(
        pathname.slice(
          '/promos/'.length
        )
      );

    return {
      id:
        `route:${route}:promotion:${promotionId}`,

      type:
        'promotion',

      source:
        'route',

      targetId:
        promotionId,

      route,

      surface,

      title:
        'Promotion experience',

      createdAt
    };
  }

  if (
    surface === 'search'
  ) {
    const query =
      searchParams.get('q') ??
      searchParams.get(
        'query'
      ) ??
      '';

    return {
      id:
        `route:${route}:search:${query}`,

      type:
        'search',

      source:
        'search',

      query,

      route,

      surface,

      title:
        query
          ? `Search: ${query}`
          : 'Search',

      createdAt
    };
  }

  return {
    id:
      `route:${route}`,

    type:
      'home',

    source:
      'route',

    route,

    surface,

    title:
      routeTitle(
        surface
      ),

    createdAt
  };
}
