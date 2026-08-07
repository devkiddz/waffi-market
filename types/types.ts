import type { LucideIcon } from 'lucide-react';

export type SubcategoryType = {
  label: string;
  slug: string;
};

export type CategoryType = {
  id: string;
  slug: string;
  label: string;
  icon: LucideIcon;
  image: string;
  coverImages: string[];
  shortDescription: string;
  description: string;
  accentColor?: string;
  subcategories: SubcategoryType[];
  className?: string;
};

export type categoryType = CategoryType;

/* SHELSEA_VARIANT_COLOR_GALLERY_CONTRACT_V1 */
export type ProductVariantType = {
  id: string;
  label: string;
  image: string;

  /**
   * Optional richer commerce presentation metadata.
   * Existing catalog rows remain valid without these fields.
   */
  color?: string;
  colorHex?: string;
  images?: string[];

  price: number;
  stockLeft: number;
};

export type ProductMerchantType = {
  id: string;
  slug: string;
  name: string;
  logoUrl?: string;
};

export type ProductType = {
  id: string;
  slug: string;
  name: string;

  ownership?: 'platform' | 'vendor';
  merchant?: ProductMerchantType;

  shortDescription: string;
  longDescription: string;
  category: string;
  subcategory?: string;
  tags: string[];

  /**
   * AJ_PRODUCT_PAGE_GALLERY_ASSETS_V1
   * Ordered public ProductImage assets for canonical presentation.
   */
  images?: string[];

  variants: ProductVariantType[];
  rating: number;
  reviews: number;
  soldCount: number;
  liked: boolean;
  featured: boolean;
  isNew: boolean;
  estimatedDelivery: string;
  discountPercentage: number;
};

export type DiscoverySectionType = {
  category: CategoryType;
  products: ProductType[];
};

export type UserType = {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  wishlist: string[];
  cart: Array<{
    productId: string;
    quantity: number;
  }>;
};

export type ProductsType = ProductType[];
export type CategoriesType = CategoryType[];
