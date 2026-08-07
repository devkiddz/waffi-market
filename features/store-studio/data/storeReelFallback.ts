import type { StoreStudioReelProjection } from '../contracts';

/**
 * Shelsea showcase Reel fixtures.
 * Database-backed Reel campaigns take precedence when Store Studio campaigns exist.
 */
export const fallbackStoreReels: StoreStudioReelProjection[] = [
  {
    id: "fallback-reel-shelsea-new-season",
    campaignId: "fallback-campaign-shelsea-new-season",
    workspaceId: "shelsea-commerce-live",
    vendorId: null,
    vendorName: "Shelsea",
    title: "Dress With Intention",
    caption: "A quick look at new-season pieces ready to explore online.",
    videoUrl: "/shelsea/reels/new-season.mp4",
    posterUrl: "/shelsea/stories/new-season.png",
    durationMs: 4000,
    autoplay: true,
    action: {
      label: "Explore",
      href: "/store"
    },
    detailHref: null,
    productId: "prod_1",
    promotionId: null,
    collectionId: null,
    priority: 120
  },
  {
    id: "fallback-reel-shelsea-mens-edit",
    campaignId: "fallback-campaign-shelsea-mens-edit",
    workspaceId: "shelsea-commerce-live",
    vendorId: null,
    vendorName: "Shelsea",
    title: "Modern Men's Edit",
    caption: "Smart everyday pieces with product details, variants and stock in one place.",
    videoUrl: "/shelsea/reels/mens-edit.mp4",
    posterUrl: "/shelsea/stories/mens-edit.png",
    durationMs: 4000,
    autoplay: true,
    action: {
      label: "Explore",
      href: "/store"
    },
    detailHref: null,
    productId: "prod_21",
    promotionId: null,
    collectionId: null,
    priority: 115
  },
  {
    id: "fallback-reel-shelsea-bags",
    campaignId: "fallback-campaign-shelsea-bags",
    workspaceId: "shelsea-commerce-live",
    vendorId: null,
    vendorName: "Shelsea",
    title: "The Bag Edit",
    caption: "From work bags to statement pieces, discover the finishing touch.",
    videoUrl: "/shelsea/reels/bags.mp4",
    posterUrl: "/shelsea/stories/bags.png",
    durationMs: 4000,
    autoplay: true,
    action: {
      label: "Explore",
      href: "/store"
    },
    detailHref: null,
    productId: "prod_57",
    promotionId: null,
    collectionId: null,
    priority: 110
  },
  {
    id: "fallback-reel-shelsea-heels",
    campaignId: "fallback-campaign-shelsea-heels",
    workspaceId: "shelsea-commerce-live",
    vendorId: null,
    vendorName: "Shelsea",
    title: "Step Into It",
    caption: "Shoes selected for work, weekends and evenings.",
    videoUrl: "/shelsea/reels/heels.mp4",
    posterUrl: "/shelsea/stories/heels.png",
    durationMs: 4000,
    autoplay: true,
    action: {
      label: "Explore",
      href: "/store"
    },
    detailHref: null,
    productId: "prod_67",
    promotionId: null,
    collectionId: null,
    priority: 105
  },
  {
    id: "fallback-reel-shelsea-wig-room",
    campaignId: "fallback-campaign-shelsea-wig-room",
    workspaceId: "shelsea-commerce-live",
    vendorId: null,
    vendorName: "Shelsea",
    title: "The Wig Room",
    caption: "Compare lengths, styles and available stock before you buy.",
    videoUrl: "/shelsea/reels/wig-room.mp4",
    posterUrl: "/shelsea/stories/wig-room.png",
    durationMs: 4000,
    autoplay: true,
    action: {
      label: "Explore",
      href: "/store"
    },
    detailHref: null,
    productId: "prod_97",
    promotionId: null,
    collectionId: null,
    priority: 100
  },
  {
    id: "fallback-reel-shelsea-hair-care",
    campaignId: "fallback-campaign-shelsea-hair-care",
    workspaceId: "shelsea-commerce-live",
    vendorId: null,
    vendorName: "Shelsea",
    title: "Hair Routine",
    caption: "Build a complete hair-care routine from one storefront.",
    videoUrl: "/shelsea/reels/hair-care.mp4",
    posterUrl: "/shelsea/stories/hair-care.png",
    durationMs: 4000,
    autoplay: true,
    action: {
      label: "Explore",
      href: "/store"
    },
    detailHref: null,
    productId: null,
    promotionId: "hair-refresh",
    collectionId: null,
    priority: 95
  },
  {
    id: "fallback-reel-shelsea-women-scents",
    campaignId: "fallback-campaign-shelsea-women-scents",
    workspaceId: "shelsea-commerce-live",
    vendorId: null,
    vendorName: "Shelsea",
    title: "Signature Scent",
    caption: "Find a fragrance by mood, size and budget.",
    videoUrl: "/shelsea/reels/women-scents.mp4",
    posterUrl: "/shelsea/stories/women-scents.png",
    durationMs: 4000,
    autoplay: true,
    action: {
      label: "Explore",
      href: "/store"
    },
    detailHref: null,
    productId: "prod_133",
    promotionId: null,
    collectionId: null,
    priority: 90
  },
  {
    id: "fallback-reel-shelsea-mens-scents",
    campaignId: "fallback-campaign-shelsea-mens-scents",
    workspaceId: "shelsea-commerce-live",
    vendorId: null,
    vendorName: "Shelsea",
    title: "Presence Before Words",
    caption: "Explore masculine fragrance options without leaving the shopping experience.",
    videoUrl: "/shelsea/reels/mens-scents.mp4",
    posterUrl: "/shelsea/stories/mens-scents.png",
    durationMs: 4000,
    autoplay: true,
    action: {
      label: "Explore",
      href: "/store"
    },
    detailHref: null,
    productId: "prod_142",
    promotionId: null,
    collectionId: null,
    priority: 85
  }
];
