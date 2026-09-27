import type {
  ProductType,
  ProductVariantType
} from '@/types/types';

export type ProductCardPresentation =
  | 'standard'
  | 'featured'
  | 'collection'
  | 'hero'
  | 'compact';

export type ProductCardActions = {
  /**
   * Canonical product-card action.
   *
   * Every product entry surface opens the assembled Product
   * Experience inside the central Feed.
   */
  onOpenExperience?: (
    product: ProductType
  ) => void;

  /**
   * Temporary compatibility alias for older Feed modules.
   */
  onPreview?: (
    product: ProductType
  ) => void;

  /**
   * Temporary compatibility field for older card consumers.
   */
  onToggleLike?: (
    productId: string
  ) => void | Promise<void>;

  /**
   * Optional compatibility adapter for Feed actions.
   */
  onAddToCart?: (
    product: ProductType,
    variant: ProductVariantType
  ) => void | Promise<void>;

  /**
   * Opens the product-aware AI experience.
   */
  onAskAI?: (
    product: ProductType,
    variant: ProductVariantType | null
  ) => void | Promise<void>;
};

export type BaseProductCardProps =
  ProductCardActions & {
    product: ProductType;

    presentation?: ProductCardPresentation;

    className?: string;

    locale?: string;
    currency?: string;
  };
