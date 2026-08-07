import type {
  StoreStudioBannerSlideProjection
} from '../contracts';

/**
 * Temporary Store Showcase banner while the Store Studio admin is unfinished.
 * Database-backed banner campaigns always take precedence.
 */
export const fallbackStoreBannerSlides:
  StoreStudioBannerSlideProjection[] = [
    {
      id: 'fallback-store-banner',
      campaignId: 'fallback-store-banner-campaign',
      mediaType: 'image',
      mediaUrl:
        '/store-studio/banners/aj-logik-store-showcase.png',
      mobileMediaUrl: null,
      posterUrl: null,
      eyebrow: 'Shelsea Store',
      title: 'Style, beauty and everyday confidence — beautifully curated.',
      description:
        'Discover clothing, accessories, hair and fragrances selected for every style and moment.',
      primaryAction: {
        label: 'Shop the store',
        href: '/store'
      },
      secondaryAction: {
        label: 'Explore deals',
        href: '/store?category=deals'
      },
      autoplay: false,
      durationMs: 8_000,
      position: 0
    }
  ];
