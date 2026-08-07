export type PromoType = 'discount' | 'sale' | 'hot' | 'best-selling';
export type PromoLayout = 'banner' | 'card' | 'shelf';
export type Promo = {
  id: string; slug: string; title: string; subtitle?: string; description?: string;
  type: PromoType; layout: PromoLayout; badge: string; discountPercent?: number;
  startsAt?: string; endsAt?: string; terms?: string[]; productIds: string[];
  image?: string; href?: string; active: boolean; priority: number;
  theme?: { accent: string; gradient?: string; };
};

export const promos: Promo[] = [
  {
    id: "promo_1",
    slug: "new-arrivals-week",
    title: "New Arrivals Week",
    subtitle: "Curated online-store selections from Shelsea.",
    description: "Discover new arrivals week with direct product discovery, variants and checkout-ready inventory.",
    type: "discount",
    layout: "card",
    badge: "NEW THIS WEEK",
    discountPercent: 12,
    productIds: [
      "prod_1",
      "prod_2",
      "prod_4",
      "prod_8",
      "prod_12",
      "prod_16",
      "prod_21",
      "prod_25"
    ],
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop",
    href: "/promos/new-arrivals-week",
    active: true,
    priority: 1,
    theme: {
      accent: "#7C3AED",
      gradient: "bg-gradient-to-br from-slate-950 via-zinc-950 to-black"
    }
  },
  {
    id: "promo_2",
    slug: "dress-up-offer",
    title: "Dress-Up Offer",
    subtitle: "Curated online-store selections from Shelsea.",
    description: "Discover dress-up offer with direct product discovery, variants and checkout-ready inventory.",
    type: "discount",
    layout: "card",
    badge: "UP TO 15% OFF",
    discountPercent: 15,
    productIds: [
      "prod_3",
      "prod_7",
      "prod_9",
      "prod_15",
      "prod_18",
      "prod_57",
      "prod_62"
    ],
    image: "https://images.unsplash.com/photo-1566174053879-31528523f8ae?q=85&w=1200&auto=format&fit=crop",
    href: "/promos/dress-up-offer",
    active: true,
    priority: 2,
    theme: {
      accent: "#7C3AED",
      gradient: "bg-gradient-to-br from-slate-950 via-zinc-950 to-black"
    }
  },
  {
    id: "promo_3",
    slug: "hair-refresh",
    title: "Hair Refresh",
    subtitle: "Curated online-store selections from Shelsea.",
    description: "Discover hair refresh with direct product discovery, variants and checkout-ready inventory.",
    type: "discount",
    layout: "card",
    badge: "HAIR EDIT",
    discountPercent: 10,
    productIds: [
      "prod_97",
      "prod_99",
      "prod_101",
      "prod_109",
      "prod_115",
      "prod_121"
    ],
    image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?q=85&w=1200&auto=format&fit=crop",
    href: "/promos/hair-refresh",
    active: true,
    priority: 3,
    theme: {
      accent: "#7C3AED",
      gradient: "bg-gradient-to-br from-slate-950 via-zinc-950 to-black"
    }
  },
  {
    id: "promo_4",
    slug: "signature-scent-week",
    title: "Signature Scent Week",
    subtitle: "Curated online-store selections from Shelsea.",
    description: "Discover signature scent week with direct product discovery, variants and checkout-ready inventory.",
    type: "discount",
    layout: "card",
    badge: "SCENT EDIT",
    discountPercent: 12,
    productIds: [
      "prod_133",
      "prod_134",
      "prod_135",
      "prod_136",
      "prod_137",
      "prod_138",
      "prod_139",
      "prod_140",
      "prod_141",
      "prod_142",
      "prod_143",
      "prod_144",
      "prod_145",
      "prod_146"
    ],
    image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=85&w=1200&auto=format&fit=crop",
    href: "/promos/signature-scent-week",
    active: true,
    priority: 4,
    theme: {
      accent: "#7C3AED",
      gradient: "bg-gradient-to-br from-slate-950 via-zinc-950 to-black"
    }
  },
  {
    id: "promo_5",
    slug: "accessory-spotlight",
    title: "Accessory Spotlight",
    subtitle: "Curated online-store selections from Shelsea.",
    description: "Discover accessory spotlight with direct product discovery, variants and checkout-ready inventory.",
    type: "discount",
    layout: "card",
    badge: "FINISH THE LOOK",
    discountPercent: 8,
    productIds: [
      "prod_57",
      "prod_60",
      "prod_67",
      "prod_71",
      "prod_76",
      "prod_81",
      "prod_87"
    ],
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=85&w=1200&auto=format&fit=crop",
    href: "/promos/accessory-spotlight",
    active: true,
    priority: 5,
    theme: {
      accent: "#7C3AED",
      gradient: "bg-gradient-to-br from-slate-950 via-zinc-950 to-black"
    }
  },
  {
    id: "promo_6",
    slug: "shelsea-best-sellers",
    title: "Shelsea Best Sellers",
    subtitle: "Curated online-store selections from Shelsea.",
    description: "Discover shelsea best sellers with direct product discovery, variants and checkout-ready inventory.",
    type: "best-selling",
    layout: "card",
    badge: "BEST SELLER",
    productIds: [
      "prod_1",
      "prod_21",
      "prod_57",
      "prod_81",
      "prod_97",
      "prod_115",
      "prod_133"
    ],
    image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop",
    href: "/promos/shelsea-best-sellers",
    active: true,
    priority: 6,
    theme: {
      accent: "#7C3AED",
      gradient: "bg-gradient-to-br from-slate-950 via-zinc-950 to-black"
    }
  }
];
