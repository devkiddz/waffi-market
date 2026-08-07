import type { ProductMerchantType } from '@/types/types';

export type CollectionIcon = { type: 'lucide' | 'image'; value: string; };
export type CollectionLayout = 'featured' | 'carousel' | 'grid' | 'spotlight';
export type CollectionBanner = { eyebrow?: string; title: string; description?: string; image?: string; ctaLabel?: string; href?: string; };
export type CollectionTheme = { accent: string; gradient?: string; };
export type CollectionType = {
  id: string; slug: string; title: string; subtitle?: string; icon?: CollectionIcon;
  layout: CollectionLayout; banner?: CollectionBanner; featuredProductId?: string;
  productIds: string[]; active: boolean; priority: number; theme?: CollectionTheme;
  merchant?: ProductMerchantType;
};

export const collections: CollectionType[] = [
  {
    id: "collection_1",
    slug: "new-season-edit",
    title: "The New Season Edit",
    subtitle: "Dress With Intention",
    layout: "featured",
    banner: {
      eyebrow: "Shelsea Edit",
      title: "Dress With Intention",
      description: "Explore the new season edit curated across the Shelsea online store.",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop",
      ctaLabel: "Explore Collection",
      href: "/collections/new-season-edit"
    },
    featuredProductId: "prod_1",
    productIds: [
      "prod_1",
      "prod_2",
      "prod_3",
      "prod_4",
      "prod_5",
      "prod_6",
      "prod_7",
      "prod_8",
      "prod_9",
      "prod_10",
      "prod_11",
      "prod_12",
      "prod_13",
      "prod_14",
      "prod_15",
      "prod_16",
      "prod_17",
      "prod_18",
      "prod_19",
      "prod_20"
    ],
    active: true,
    priority: 1,
    theme: {
      accent: "#7C3AED",
      gradient: "bg-gradient-to-br from-slate-950 via-zinc-950 to-black"
    }
  },
  {
    id: "collection_2",
    slug: "mens-modern-classics",
    title: "Men’s Modern Classics",
    subtitle: "Sharp, Easy, Ready",
    layout: "featured",
    banner: {
      eyebrow: "Shelsea Edit",
      title: "Sharp, Easy, Ready",
      description: "Explore men’s modern classics curated across the Shelsea online store.",
      image: "https://images.unsplash.com/photo-1598033129183-c4f50c736f10?q=85&w=1200&auto=format&fit=crop",
      ctaLabel: "Explore Collection",
      href: "/collections/mens-modern-classics"
    },
    featuredProductId: "prod_21",
    productIds: [
      "prod_21",
      "prod_22",
      "prod_23",
      "prod_24",
      "prod_25",
      "prod_26",
      "prod_27",
      "prod_28",
      "prod_29",
      "prod_30",
      "prod_31",
      "prod_32",
      "prod_33",
      "prod_34",
      "prod_35",
      "prod_36"
    ],
    active: true,
    priority: 2,
    theme: {
      accent: "#334155",
      gradient: "bg-gradient-to-br from-slate-950 via-zinc-950 to-black"
    }
  },
  {
    id: "collection_3",
    slug: "everyday-comfort",
    title: "Everyday Comfort",
    subtitle: "Relaxed Style, Refined",
    layout: "featured",
    banner: {
      eyebrow: "Shelsea Edit",
      title: "Relaxed Style, Refined",
      description: "Explore everyday comfort curated across the Shelsea online store.",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=85&w=1200&auto=format&fit=crop",
      ctaLabel: "Explore Collection",
      href: "/collections/everyday-comfort"
    },
    featuredProductId: "prod_47",
    productIds: [
      "prod_47",
      "prod_48",
      "prod_49",
      "prod_50",
      "prod_51",
      "prod_52",
      "prod_53",
      "prod_54",
      "prod_55",
      "prod_56"
    ],
    active: true,
    priority: 3,
    theme: {
      accent: "#0F766E",
      gradient: "bg-gradient-to-br from-slate-950 via-zinc-950 to-black"
    }
  },
  {
    id: "collection_4",
    slug: "finishing-touch",
    title: "The Finishing Touch",
    subtitle: "Complete the Look",
    layout: "featured",
    banner: {
      eyebrow: "Shelsea Edit",
      title: "Complete the Look",
      description: "Explore the finishing touch curated across the Shelsea online store.",
      image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=85&w=1200&auto=format&fit=crop",
      ctaLabel: "Explore Collection",
      href: "/collections/finishing-touch"
    },
    featuredProductId: "prod_57",
    productIds: [
      "prod_57",
      "prod_58",
      "prod_59",
      "prod_60",
      "prod_61",
      "prod_62",
      "prod_63",
      "prod_64",
      "prod_65",
      "prod_66",
      "prod_67",
      "prod_68",
      "prod_69",
      "prod_70",
      "prod_71",
      "prod_72",
      "prod_73",
      "prod_74",
      "prod_75",
      "prod_76",
      "prod_77",
      "prod_78",
      "prod_79",
      "prod_80",
      "prod_81",
      "prod_82",
      "prod_83",
      "prod_84",
      "prod_85",
      "prod_86",
      "prod_87",
      "prod_88",
      "prod_89",
      "prod_90",
      "prod_91",
      "prod_92",
      "prod_93",
      "prod_94",
      "prod_95",
      "prod_96"
    ],
    active: true,
    priority: 4,
    theme: {
      accent: "#B45309",
      gradient: "bg-gradient-to-br from-slate-950 via-zinc-950 to-black"
    }
  },
  {
    id: "collection_5",
    slug: "wig-room",
    title: "The Wig Room",
    subtitle: "Your Crown, Your Signature",
    layout: "featured",
    banner: {
      eyebrow: "Shelsea Edit",
      title: "Your Crown, Your Signature",
      description: "Explore the wig room curated across the Shelsea online store.",
      image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?q=85&w=1200&auto=format&fit=crop",
      ctaLabel: "Explore Collection",
      href: "/collections/wig-room"
    },
    featuredProductId: "prod_97",
    productIds: [
      "prod_97",
      "prod_98",
      "prod_99",
      "prod_100",
      "prod_101",
      "prod_102",
      "prod_103",
      "prod_104",
      "prod_105",
      "prod_106",
      "prod_107",
      "prod_108"
    ],
    active: true,
    priority: 5,
    theme: {
      accent: "#BE185D",
      gradient: "bg-gradient-to-br from-slate-950 via-zinc-950 to-black"
    }
  },
  {
    id: "collection_6",
    slug: "hair-essentials",
    title: "Hair Essentials",
    subtitle: "Care, Protect, Style",
    layout: "featured",
    banner: {
      eyebrow: "Shelsea Edit",
      title: "Care, Protect, Style",
      description: "Explore hair essentials curated across the Shelsea online store.",
      image: "https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?q=85&w=1200&auto=format&fit=crop",
      ctaLabel: "Explore Collection",
      href: "/collections/hair-essentials"
    },
    featuredProductId: "prod_109",
    productIds: [
      "prod_109",
      "prod_110",
      "prod_111",
      "prod_112",
      "prod_113",
      "prod_114",
      "prod_115",
      "prod_116",
      "prod_117",
      "prod_118",
      "prod_119",
      "prod_120",
      "prod_121",
      "prod_122",
      "prod_123",
      "prod_124",
      "prod_125",
      "prod_126",
      "prod_127",
      "prod_128",
      "prod_129",
      "prod_130",
      "prod_131",
      "prod_132"
    ],
    active: true,
    priority: 6,
    theme: {
      accent: "#0E7490",
      gradient: "bg-gradient-to-br from-slate-950 via-zinc-950 to-black"
    }
  },
  {
    id: "collection_7",
    slug: "signature-scents",
    title: "Signature Scents",
    subtitle: "Leave a Lasting Impression",
    layout: "featured",
    banner: {
      eyebrow: "Shelsea Edit",
      title: "Leave a Lasting Impression",
      description: "Explore signature scents curated across the Shelsea online store.",
      image: "https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=85&w=1200&auto=format&fit=crop",
      ctaLabel: "Explore Collection",
      href: "/collections/signature-scents"
    },
    featuredProductId: "prod_133",
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
      "prod_146",
      "prod_147",
      "prod_148",
      "prod_149",
      "prod_150",
      "prod_151",
      "prod_152",
      "prod_153",
      "prod_154",
      "prod_155",
      "prod_156",
      "prod_157",
      "prod_158",
      "prod_159",
      "prod_160",
      "prod_161",
      "prod_162",
      "prod_163",
      "prod_164",
      "prod_165",
      "prod_166",
      "prod_167",
      "prod_168"
    ],
    active: true,
    priority: 7,
    theme: {
      accent: "#7C2D12",
      gradient: "bg-gradient-to-br from-slate-950 via-zinc-950 to-black"
    }
  },
  {
    id: "collection_8",
    slug: "shelsea-favourites",
    title: "Shelsea Favourites",
    subtitle: "The Pieces Worth Repeating",
    layout: "featured",
    banner: {
      eyebrow: "Shelsea Edit",
      title: "The Pieces Worth Repeating",
      description: "Explore shelsea favourites curated across the Shelsea online store.",
      image: "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop",
      ctaLabel: "Explore Collection",
      href: "/collections/shelsea-favourites"
    },
    featuredProductId: "prod_81",
    productIds: [
      "prod_1",
      "prod_4",
      "prod_9",
      "prod_21",
      "prod_34",
      "prod_57",
      "prod_68",
      "prod_81",
      "prod_97",
      "prod_101",
      "prod_115",
      "prod_126",
      "prod_133",
      "prod_140"
    ],
    active: true,
    priority: 8,
    theme: {
      accent: "#111827",
      gradient: "bg-gradient-to-br from-slate-950 via-zinc-950 to-black"
    }
  }
];
