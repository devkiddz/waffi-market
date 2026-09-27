const EXCLUDED_CUSTOMER_PREFIXES = [
  '/admin',
  '/vendor',
  '/adminlogin'
] as const;

export function isCustomerExperienceRoute(
  pathname: string
): boolean {
  return !EXCLUDED_CUSTOMER_PREFIXES.some(
    prefix =>
      pathname ===
        prefix ||
      pathname.startsWith(
        `${prefix}/`
      )
  );
}

export function resolveCustomerSurface(
  pathname: string
): string {
  if (
    pathname ===
    '/'
  ) {
    return 'home';
  }

  if (
    pathname ===
      '/sign-in' ||
    pathname.startsWith(
      '/sign-in/'
    )
  ) {
    return 'auth';
  }

  if (
    pathname ===
      '/sign-up' ||
    pathname.startsWith(
      '/sign-up/'
    )
  ) {
    return 'auth';
  }

  if (
    pathname ===
      '/store' ||
    pathname.startsWith(
      '/store/'
    )
  ) {
    return 'store';
  }

  if (
    pathname ===
      '/account' ||
    pathname.startsWith(
      '/account/'
    )
  ) {
    return 'account';
  }

  if (
    pathname ===
      '/cart' ||
    pathname.startsWith(
      '/cart/'
    )
  ) {
    return 'cart';
  }

  if (
    pathname ===
      '/orders' ||
    pathname.startsWith(
      '/orders/'
    )
  ) {
    return 'orders';
  }

  if (
    pathname ===
      '/wishlist' ||
    pathname.startsWith(
      '/wishlist/'
    )
  ) {
    return 'wishlist';
  }

  if (
    pathname ===
      '/rewards' ||
    pathname.startsWith(
      '/rewards/'
    )
  ) {
    return 'rewards';
  }

  if (
    pathname ===
      '/membership' ||
    pathname.startsWith(
      '/membership/'
    )
  ) {
    return 'rewards';
  }

  if (
    pathname ===
      '/settings' ||
    pathname.startsWith(
      '/settings/'
    )
  ) {
    return 'settings';
  }

  if (
    pathname ===
      '/search' ||
    pathname.startsWith(
      '/search/'
    )
  ) {
    return 'search';
  }

  if (
    pathname ===
      '/discover' ||
    pathname.startsWith(
      '/discover/'
    )
  ) {
    return 'discover';
  }

  if (
    pathname ===
      '/ai' ||
    pathname.startsWith(
      '/ai/'
    )
  ) {
    return 'ai';
  }

  if (
    pathname ===
      '/support' ||
    pathname.startsWith(
      '/support/'
    )
  ) {
    return 'support';
  }

  if (
    pathname ===
      '/lists' ||
    pathname.startsWith(
      '/lists/'
    )
  ) {
    return 'shopping-list';
  }

  if (
    pathname ===
      '/checkout' ||
    pathname.startsWith(
      '/checkout/'
    )
  ) {
    return 'checkout';
  }

  if (
    pathname ===
      '/payments' ||
    pathname.startsWith(
      '/payments/'
    )
  ) {
    return 'checkout';
  }

  if (
    pathname ===
      '/tracking' ||
    pathname.startsWith(
      '/tracking/'
    )
  ) {
    return 'tracking';
  }


  if (
    pathname ===
      '/vendors' ||
    pathname.startsWith(
      '/vendors/'
    )
  ) {
    return 'shop';
  }

  if (
    pathname ===
      '/collections' ||
    pathname.startsWith(
      '/collections/'
    )
  ) {
    return 'collection';
  }

  if (
    pathname.startsWith(
      '/products/'
    )
  ) {
    return 'product';
  }

  if (
    pathname.startsWith(
      '/promos/'
    )
  ) {
    return 'promotion';
  }

  if (
    pathname.startsWith(
      '/reels/'
    )
  ) {
    return 'reel';
  }

  return 'default';
}
