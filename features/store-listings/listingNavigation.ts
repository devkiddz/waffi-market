type BuildStoreListingHrefInput = {
  title: string;
  subtitle?: string;
  key?: string;
  moduleId?: string;
  source?: string;
  categorySlug?: string;
  productIds?: string[];
};

export function slugifyListingKey(
  value: string
): string {
  return (
    value
      .trim()
      .toLowerCase()
      .replace(/&/g, ' and ')
      .replace(/['’]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '') ||
    'products'
  );
}

function inferCategorySlug(
  moduleId?: string
): string | undefined {
  if (!moduleId) {
    return undefined;
  }

  const prefixes = [
    'store-category-shelf-',
    'store-more-discoveries-',
    'store-special-picks-',
    'store-recently-viewed-'
  ];

  for (
    const prefix of prefixes
  ) {
    if (
      moduleId.startsWith(
        prefix
      )
    ) {
      return (
        moduleId.slice(
          prefix.length
        ) || undefined
      );
    }
  }

  return undefined;
}

export function buildStoreListingHref({
  title,
  subtitle,
  key,
  moduleId,
  source,
  categorySlug,
  productIds = []
}: BuildStoreListingHrefInput): string {
  const listingKey =
    slugifyListingKey(
      key ?? title
    );

  const params =
    new URLSearchParams();

  params.set(
    'title',
    title
  );

  if (subtitle) {
    params.set(
      'subtitle',
      subtitle
    );
  }

  if (source) {
    params.set(
      'source',
      source
    );
  }

  const resolvedCategory =
    categorySlug ??
    inferCategorySlug(
      moduleId
    );

  if (resolvedCategory) {
    params.set(
      'category',
      resolvedCategory
    );
  }

  if (
    productIds.length >
    0
  ) {
    params.set(
      'ids',
      Array.from(
        new Set(
          productIds
        )
      ).join(',')
    );
  }

  const query =
    params.toString();

  return (
    `/store/listings/${encodeURIComponent(listingKey)}` +
    (
      query
        ? `?${query}`
        : ''
    )
  );
}
