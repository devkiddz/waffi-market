import type {
  CategoryType,
  ProductType,
  ProductVariantType
} from '@/types/types';

export type ProductDeepInsightAwarenessSignal = {
  label: string;
  value: string;
  detail: string;
};

export type ProductDeepInsightFaq = {
  id: string;
  question: string;
  answer: string;
};

export type ProductDeepInsightSuggestion = {
  id: string;
  title: string;
  detail: string;
  productId?: string;
};

export type ProductDeepInsightMedia = {
  id: string;
  src: string;
  alt: string;
  label: string;
  source: 'catalog';
};

export type ProductDeepInsightRelatedProduct = {
  product: ProductType;
  variant: ProductVariantType;
  reason: string;
};

export type ResolvedCatalogProductDeepInsight = {
  product: ProductType;
  category: CategoryType | null;
  selectedVariant: ProductVariantType | null;
  decisionSignals: string[];
  awarenessSignals: ProductDeepInsightAwarenessSignal[];
  faqs: ProductDeepInsightFaq[];
  suggestions: ProductDeepInsightSuggestion[];
  media: ProductDeepInsightMedia[];
  relatedProducts: ProductDeepInsightRelatedProduct[];
  sourceNote: string;
};

type ResolveCatalogProductDeepInsightInput = {
  productId: string;
  variantId?: string | null;
  products: ProductType[];
  categories: CategoryType[];
};

function normalizedText(
  value?: string
): string | null {
  const normalized =
    value?.trim();

  return normalized ||
    null;
}

function formatLabel(
  value: string
): string {
  return value
    .replace(
      /[-_]+/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim()
    .replace(
      /\b\w/g,
      letter =>
        letter.toUpperCase()
    );
}

function firstAvailableVariant(
  product: ProductType
): ProductVariantType | null {
  return (
    product.variants.find(
      variant =>
        variant.stockLeft >
        0
    ) ??
    product.variants[0] ??
    null
  );
}

function resolveSelectedVariant(
  product: ProductType,
  variantId?: string | null
): ProductVariantType | null {
  if (
    variantId
  ) {
    const selected =
      product.variants.find(
        variant =>
          String(
            variant.id
          ) ===
          String(
            variantId
          )
      );

    if (
      selected
    ) {
      return selected;
    }
  }

  return firstAvailableVariant(
    product
  );
}

function normalizedTagSet(
  product: ProductType
): Set<string> {
  return new Set(
    (
      product.tags ??
      []
    )
      .map(
        tag =>
          tag
            .trim()
            .toLowerCase()
      )
      .filter(
        Boolean
      )
  );
}

function resolveRelatedProducts(
  product: ProductType,
  selectedVariant:
    ProductVariantType |
    null,
  products: ProductType[]
): ProductDeepInsightRelatedProduct[] {
  const activePrice =
    Number(
      selectedVariant?.price ??
      0
    );

  const tags =
    normalizedTagSet(
      product
    );

  return products
    .filter(
      candidate =>
        String(
          candidate.id
        ) !==
        String(
          product.id
        )
    )
    .map(
      candidate => {
        const candidateVariant =
          firstAvailableVariant(
            candidate
          );

        if (
          !candidateVariant
        ) {
          return null;
        }

        const candidatePrice =
          Number(
            candidateVariant.price
          );

        const sharedTags =
          (
            candidate.tags ??
            []
          ).filter(
            tag =>
              tags.has(
                tag
                  .trim()
                  .toLowerCase()
              )
          );

        const sameCategory =
          candidate.category ===
          product.category;

        const sameSubcategory =
          Boolean(
            product.subcategory &&
            candidate.subcategory ===
              product.subcategory
          );

        const priceDistance =
          activePrice >
            0 &&
          candidatePrice >
            0
            ? Math.abs(
                candidatePrice -
                activePrice
              ) /
              activePrice
            : 1;

        const score =
          (
            sameCategory
              ? 40
              : 0
          ) +
          (
            sameSubcategory
              ? 24
              : 0
          ) +
          sharedTags.length *
            7 +
          Math.min(
            Number(
              candidate.rating
            ) ||
              0,
            5
          ) *
            2 +
          (
            candidate.featured
              ? 4
              : 0
          ) +
          (
            candidate.isNew
              ? 2
              : 0
          ) -
          Math.min(
            priceDistance *
              12,
            12
          );

        const reasons =
          [
            sameSubcategory &&
            candidate.subcategory
              ? `Same ${formatLabel(
                  candidate.subcategory
                )}`
              : null,

            sharedTags[0]
              ? `Shared ${formatLabel(
                  sharedTags[0]
                )}`
              : null,

            priceDistance <=
            0.2
              ? 'Close price range'
              : null,

            sameCategory
              ? `Same ${formatLabel(
                  product.category
                )} category`
              : null
          ]
            .filter(
              (
                value
              ): value is string =>
                Boolean(
                  value
                )
            )
            .slice(
              0,
              2
            );

        return {
          score,

          product:
            candidate,

          variant:
            candidateVariant,

          reason:
            reasons.join(
              ' · '
            ) ||
            'Related catalog option'
        };
      }
    )
    .filter(
      (
        candidate
      ): candidate is ProductDeepInsightRelatedProduct & {
        score: number;
      } =>
        candidate !==
        null
    )
    .sort(
      (
        first,
        second
      ) =>
        second.score -
          first.score ||
        Number(
          second.product
            .rating
        ) -
          Number(
            first.product
              .rating
          )
    )
    .slice(
      0,
      4
    )
    .map(
      ({
        score:
          _score,
        ...candidate
      }) =>
        candidate
    );
}

function resolveMedia(
  product: ProductType,
  category:
    CategoryType |
    null,
  selectedVariant:
    ProductVariantType |
    null
): ProductDeepInsightMedia[] {
  const candidates: Array<{
    src?: string | null;
    alt: string;
    label: string;
  }> = [
    {
      src:
        selectedVariant?.image,

      alt:
        selectedVariant?.label
          ? `${product.name} — ${selectedVariant.label}`
          : product.name,

      label:
        selectedVariant?.label ??
        'Selected product'
    },

    ...product.variants.map(
      variant => ({
        src:
          variant.image,

        alt:
          `${product.name} — ${variant.label}`,

        label:
          variant.label
      })
    ),

    ...(
      category?.coverImages ??
      []
    ).map(
      (
        src,
        index
      ) => ({
        src,

        alt:
          `${category?.label ?? formatLabel(product.category)} lifestyle view`,

        label:
          index ===
          0
            ? 'Category atmosphere'
            : `Lifestyle view ${index + 1}`
      })
    ),

    {
      src:
        category?.image,

      alt:
        `${category?.label ?? formatLabel(product.category)} category`,

      label:
        'Category context'
    }
  ];

  const seen =
    new Set<string>();

  return candidates
    .filter(
      candidate => {
        const src =
          candidate.src?.trim();

        if (
          !src ||
          seen.has(
            src
          )
        ) {
          return false;
        }

        seen.add(
          src
        );

        return true;
      }
    )
    .slice(
      0,
      5
    )
    .map(
      (
        candidate,
        index
      ) => ({
        id:
          `media:${index}:${candidate.src}`,

        src:
          candidate.src as string,

        alt:
          candidate.alt,

        label:
          candidate.label,

        source:
          'catalog'
      })
    );
}

export function resolveCatalogProductDeepInsight({
  productId,
  variantId,
  products,
  categories
}: ResolveCatalogProductDeepInsightInput):
  ResolvedCatalogProductDeepInsight |
  null {
  const product =
    products.find(
      candidate =>
        String(
          candidate.id
        ) ===
        String(
          productId
        )
    );

  if (
    !product
  ) {
    return null;
  }

  const category =
    categories.find(
      candidate =>
        candidate.slug ===
        product.category
    ) ??
    null;

  const selectedVariant =
    resolveSelectedVariant(
      product,
      variantId
    );

  const relatedProducts =
    resolveRelatedProducts(
      product,
      selectedVariant,
      products
    );

  const description =
    normalizedText(
      product.longDescription
    ) ??
    normalizedText(
      product.shortDescription
    ) ??
    `${product.name} is listed in ${category?.label ?? formatLabel(product.category)}.`;

  const ratingEvidence =
    product.reviews >
      0
      ? `${product.rating}/5 from ${product.reviews.toLocaleString()} customer reviews inside Shelsea.`
      : 'No approved customer-review evidence is available yet.';

  const movementEvidence =
    product.soldCount >
      0
      ? `${product.soldCount.toLocaleString()} recorded sales provide an Shelsea marketplace-activity signal.`
      : 'Recorded sales activity is not yet strong enough to describe marketplace movement.';

  const availabilityEvidence =
    selectedVariant
      ? selectedVariant.stockLeft >
        0
        ? `${selectedVariant.stockLeft.toLocaleString()} units of ${selectedVariant.label} are currently listed as available.`
        : `${selectedVariant.label} is currently out of stock.`
      : 'No purchasable option is currently resolved.';

  const visibilityValue =
    product.featured
      ? 'Featured'
      : product.isNew
        ? 'New arrival'
        : 'Standard listing';

  const decisionSignals =
    [
      description,

      ratingEvidence,

      product.discountPercentage >
      0
        ? `${product.discountPercentage}% off improves its current catalog value position.`
        : availabilityEvidence,

      relatedProducts[0]
        ? `${relatedProducts[0].product.name} is the closest catalog comparison AJ can resolve right now.`
        : 'No sufficiently close catalog alternative is currently resolved.'
    ];

  const awarenessSignals:
    ProductDeepInsightAwarenessSignal[] =
      [
        {
          label:
            'Catalogue visibility',

          value:
            visibilityValue,

          detail:
            product.featured
              ? 'Shelsea is currently giving this product elevated discovery visibility.'
              : product.isNew
                ? 'The listing is still in its new-arrival period.'
                : 'The product is available through normal catalogue discovery.'
        },

        {
          label:
            'Customer response',

          value:
            product.reviews >
              0
              ? `${product.rating}/5`
              : 'Not established',

          detail:
            ratingEvidence
        },

        {
          label:
            'Marketplace movement',

          value:
            product.soldCount >
              0
              ? `${product.soldCount.toLocaleString()} sold`
              : 'Early signal',

          detail:
            movementEvidence
        },

        {
          label:
            'Current availability',

          value:
            selectedVariant
              ? selectedVariant.stockLeft >
                0
                ? `${selectedVariant.stockLeft.toLocaleString()} available`
                : 'Out of stock'
              : 'Unresolved',

          detail:
            availabilityEvidence
        }
      ];

  const faqs:
    ProductDeepInsightFaq[] =
      [
        {
          id:
            'what-is-this',

          question:
            `What should I know about ${product.name}?`,

          answer:
            description
        },

        {
          id:
            'selected-option',

          question:
            'Which option is currently selected?',

          answer:
            selectedVariant
              ? `${selectedVariant.label} is selected. ${availabilityEvidence}`
              : 'AJ could not resolve a current product option.'
        },

        {
          id:
            'public-awareness',

          question:
            'How publicly established is this product?',

          answer:
            `${ratingEvidence} ${movementEvidence} These are Shelsea marketplace signals, not a claim about the wider public market.`
        },

        {
          id:
            'delivery',

          question:
            'What does delivery currently look like?',

          answer:
            normalizedText(
              product.estimatedDelivery
            )
              ? `The current catalogue estimate is ${product.estimatedDelivery}. Final timing still depends on checkout and fulfilment conditions.`
              : 'A delivery estimate is not currently available in the catalogue.'
        },

        {
          id:
            'comparison',

          question:
            'What should I compare before deciding?',

          answer:
            relatedProducts[0]
              ? `Compare the selected option, price, availability and characteristics with ${relatedProducts[0].product.name}. AJ resolved it because: ${relatedProducts[0].reason}.`
              : 'Compare the selected option, price, stock, delivery estimate and product characteristics before purchasing.'
        }
      ];

  const suggestions:
    ProductDeepInsightSuggestion[] =
      [
        {
          id:
            'verify-option',

          title:
            'Confirm the exact option',

          detail:
            selectedVariant
              ? `You are assessing ${selectedVariant.label}. Check its stock, price and delivery before finalizing.`
              : 'Choose an available variant before making a purchase decision.'
        },

        {
          id:
            'use-shopping-list',

          title:
            'Keep the decision connected',

          detail:
            'Add the product to a Shopping List when you are planning an occasion, comparing a group of items or returning later.'
        },

        ...(
          relatedProducts[0]
            ? [
                {
                  id:
                    'compare-nearest',

                  title:
                    `Compare with ${relatedProducts[0].product.name}`,

                  detail:
                    relatedProducts[0].reason,

                  productId:
                    relatedProducts[0].product.id
                }
              ]
            : []
        ),

        {
          id:
            'media-context',

          title:
            'Explore the product visually',

          detail:
            'Use the available product and category imagery as context. Verified lifestyle photos and video can enrich this section when source resolution is added.'
        }
      ];

  return {
    product,
    category,
    selectedVariant,
    decisionSignals,
    awarenessSignals,
    faqs,
    suggestions,
    media:
      resolveMedia(
        product,
        category,
        selectedVariant
      ),
    relatedProducts,
    sourceNote:
      'This Deep Insight is grounded in Shelsea catalogue data, approved customer activity and current commerce state. It does not claim wider public awareness or external facts until verified sources are connected.'
  };
}
