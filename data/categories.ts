import {
  BadgePercent,
  LayoutGrid,
  Scissors,
  Shirt,
  ShoppingBag,
  Sparkles
} from 'lucide-react';

export const categories = [
  {
    id: 'all',
    slug: 'all',
    label: 'All Products',
    icon: LayoutGrid,
    accentColor: '#173D7A',
    image:
      'https://images.unsplash.com/photo-1483985988355-763728e1935b?q=85&w=1200&auto=format&fit=crop',
    coverImages: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1541643600914-78b084683601?q=85&w=1200&auto=format&fit=crop'
    ],
    shortDescription:
      'Discover the complete Shelsea fashion, hair and fragrance collection.',
    description:
      'Shop clothing, intimates, statement accessories, premium hair pieces and memorable fragrances curated for modern style.',
    subcategories: [
      { label: 'New Arrivals', slug: 'new-arrivals' },
      { label: 'Best Sellers', slug: 'best-sellers' },
      { label: 'Trending Now', slug: 'trending' }
    ]
  },
  {
    id: 'deals',
    slug: 'deals',
    label: 'Deals',
    icon: BadgePercent,
    accentColor: '#B64E78',
    image:
      'https://images.unsplash.com/photo-1607083206968-13611e3d76db?q=85&w=1200&auto=format&fit=crop',
    coverImages: [
      'https://images.unsplash.com/photo-1607082349566-187342175e2f?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1607083206173-0a9e9c51427d?q=85&w=1200&auto=format&fit=crop'
    ],
    shortDescription:
      'Selected Shelsea pieces at special prices.',
    description:
      'Explore limited-time offers across clothing, intimates, accessories, hair and fragrances.',
    subcategories: [
      { label: 'Flash Sales', slug: 'flash-sales' },
      { label: 'Clearance', slug: 'clearance' },
      { label: 'Bundle Offers', slug: 'bundle-offers' }
    ]
  },
  {
    id: 'clothing',
    slug: 'clothing',
    label: 'Clothing',
    icon: Shirt,
    accentColor: '#173D7A',
    image:
      'https://images.unsplash.com/photo-1496747611176-843222e1e57c?q=85&w=1200&auto=format&fit=crop',
    coverImages: [
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1617137968427-85924c800a22?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=85&w=1200&auto=format&fit=crop'
    ],
    shortDescription:
      'Women, men, kids, nightwear and intimate essentials styled for real life.',
    description:
      'Shop polished women, men and kids clothing alongside elegant nightwear, lingerie, underwear and everyday wardrobe basics.',
    subcategories: [
      { label: 'Women', slug: 'women' },
      { label: 'Men', slug: 'men' },
      { label: 'Kids', slug: 'kids' },
      { label: 'Unisex', slug: 'unisex' },
      { label: 'Lingerie', slug: 'lingerie' },
      { label: 'Nightwear', slug: 'nightwear' },
      { label: 'Underwear & Basics', slug: 'underwear-basics' },
      { label: 'Socks & Hosiery', slug: 'socks-hosiery' }
    ]
  },
  {
    id: 'apparel-accessories',
    slug: 'apparel-accessories',
    label: 'Apparel & Accessories',
    icon: ShoppingBag,
    accentColor: '#C7A45D',
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=85&w=1200&auto=format&fit=crop',
    coverImages: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1524805444758-089113d48a6d?q=85&w=1200&auto=format&fit=crop'
    ],
    shortDescription:
      'Finishing pieces that make an outfit complete.',
    description:
      'Discover bags, shoes, jewelry, watches and versatile fashion accessories selected to elevate every look.',
    subcategories: [
      { label: 'Bags', slug: 'bags' },
      { label: 'Shoes', slug: 'shoes' },
      { label: 'Jewelry', slug: 'jewelry' },
      { label: 'Watches', slug: 'watches' },
      { label: 'Fashion Accessories', slug: 'fashion-accessories' }
    ]
  },
  {
    id: 'hair',
    slug: 'hair',
    label: 'Hair',
    icon: Scissors,
    accentColor: '#B64E78',
    image:
      'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?q=85&w=1200&auto=format&fit=crop',
    coverImages: [
      'https://images.unsplash.com/photo-1562322140-8baeececf3df?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?q=85&w=1200&auto=format&fit=crop'
    ],
    shortDescription:
      'Premium hair pieces, extensions and care essentials.',
    description:
      'Explore wigs, hair extensions, braiding options and everyday hair-care essentials for confident, polished looks.',
    subcategories: [
      { label: 'Wigs', slug: 'wigs' },
      { label: 'Hair Extensions', slug: 'hair-extensions' },
      { label: 'Braids', slug: 'braids' },
      { label: 'Hair Care', slug: 'hair-care' },
      { label: 'Hair Accessories', slug: 'hair-accessories' }
    ]
  },
  {
    id: 'perfumes',
    slug: 'perfumes',
    label: 'Perfumes',
    icon: Sparkles,
    accentColor: '#C7A45D',
    image:
      'https://images.unsplash.com/photo-1541643600914-78b084683601?q=85&w=1200&auto=format&fit=crop',
    coverImages: [
      'https://images.unsplash.com/photo-1594035910387-fea47794261f?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?q=85&w=1200&auto=format&fit=crop',
      'https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=85&w=1200&auto=format&fit=crop'
    ],
    shortDescription:
      'Signature fragrances chosen to leave a lasting impression.',
    description:
      'Discover refined scents for women, men and unisex wear, from fresh daytime notes to deep evening fragrances.',
    subcategories: [
      { label: "Women's Fragrances", slug: 'women-fragrances' },
      { label: "Men's Fragrances", slug: 'men-fragrances' },
      { label: 'Unisex Fragrances', slug: 'unisex-fragrances' },
      { label: 'Perfume Oils', slug: 'perfume-oils' }
    ]
  }
];
