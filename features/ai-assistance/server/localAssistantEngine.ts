import 'server-only';

/* AJ_ASSISTANCE_WORKSPACE_STAGE_2 */
/* AJ_MS12_MEANINGFUL_CONSTRAINT_REFINEMENT_V1 */
/* AJ_MS12_PLAN_EXPLANATION_AUTHORITY_V1 */
/* AJ_MS12_4_MARKETPLACE_PRODUCT_RESOLUTION_V1 */
/* AJ_MS12_4_MIXED_INSTRUCTION_AUTHORITY_V1 */
/* AJ_MS12_4_SOFT_DECREASE_PRESERVATION_V1 */
/* AJ_MS12_4_RELATIVE_BUDGET_CLARIFICATION_V1 */
/* AJ_MS12_4_CONTEXTUAL_NAIRA_INPUT_V1 */
/* AJ_MS12_4_FIXED_BUDGET_PRECEDENCE_V1 */
/* AJ_MS12_4_PLAN_LINEAGE_BUDGET_METRICS_V1 */

import type {
  Prisma
} from '@/lib/generated/prisma/client';

import {
  prisma
} from '@/lib/prisma';

import type {
  AIAssistantAction,
  AIAssistantDraftField,
  AIAssistantJourneyState,
  AIAssistantMetric,
  AIAssistantOutputType,
  AIAssistantProduct,
  AIAssistantRecognizedProductDraft,
  AIAssistantResponsePayload,
  AIAssistantRuntimeContext,
  AIAssistantSection
} from '../contracts';

import type {
  AssistantAccess
} from './assistantAccess';

import {
  resolveCollaborativeIntentResponse
} from './collaborativeIntentBuilder';

import {
  marketplaceAcknowledgement,
  marketplacePriceComparison,
  marketplaceProductSignal,
  marketplaceReason,
  marketplaceResolutionSections,
  resolveMarketplaceRequest,
  type MarketplaceProductSignal,
  type MarketplaceRequestResolution
} from './marketplaceProductResolver';

import {
  isPlanExplanationOnlyInstruction,
  isPlanMutationInstruction
} from './journeyInstructionAuthority';

import {
  hasPendingBudgetClarification,
  parseNairaAmount
} from './nairaAmountAuthority';

const productInclude = {
  category: {
    select: {
      id: true,
      slug: true,
      label: true
    }
  },
  subcategory: {
    select: {
      id: true,
      slug: true,
      label: true
    }
  },
  brand: {
    select: {
      id: true,
      slug: true,
      name: true
    }
  },
  images: {
    orderBy: [
      {
        primary: 'desc'
      },
      {
        position: 'asc'
      }
    ],
    take: 3
  },
  variants: {
    where: {
      active: true
    },
    orderBy: {
      position: 'asc'
    },
    include: {
      inventory: true
    },
    take: 8
  }
} satisfies Prisma.ProductInclude;

type ProductRecord =
  Prisma.ProductGetPayload<{
    include: typeof productInclude;
  }>;

type EngineInput = {
  access: AssistantAccess;
  prompt: string;
  context:
    AIAssistantRuntimeContext;
  conversation?:
    string[];
  journeyState?:
    AIAssistantJourneyState |
    null;
  previousPlan?:
    AIAssistantResponsePayload |
    null;
};

function normalize(
  value: string
) {
  return value
    .toLowerCase()
    .replace(
      /[^a-z0-9\s-]/g,
      ' '
    )
    .replace(
      /\s+/g,
      ' '
    )
    .trim();
}

function includesAny(
  value: string,
  terms: readonly string[]
) {
  return terms.some(
    term =>
      value.includes(
        term
      )
  );
}


function slugValue(
  value:
    string
) {
  return normalize(
    value
  )
    .replace(
      /\s+/g,
      '-'
    )
    .replace(
      /(^-|-$)/g,
      ''
    );
}

function readableName(
  value:
    string
) {
  const clean =
    value
      .replace(
        /^[\s"'`:-]+|[\s"'`.,;:-]+$/g,
        ''
      )
      .replace(
        /\s+/g,
        ' '
      )
      .trim();

  if (
    !clean
  ) {
    return '';
  }

  const hasUppercase =
    /[A-Z]/.test(
      clean
    );

  if (
    hasUppercase
  ) {
    return clean;
  }

  return clean.replace(
    /\b[a-z]/g,
    character =>
      character.toUpperCase()
  );
}

function isProductCreationPrompt(
  value:
    string
) {
  return includesAny(
    value,
    [
      'create product',
      'create a product',
      'create new product',
      'create a new product',
      'add product',
      'add a product',
      'add new product',
      'register product',
      'list product',
      'product draft',
      'new product called',
      'new product named'
    ]
  );
}

function extractProductName(
  prompt:
    string
) {
  const quoted =
    prompt.match(
      /["'`](.{2,120}?)["'`]/
    )?.[1];

  if (
    quoted
  ) {
    return readableName(
      quoted
    );
  }

  const patterns = [
    /(?:create|add|register|prepare|make|set up|list)\s+(?:a|an)?\s*(?:new\s+)?product(?:\s+draft)?(?:\s+(?:called|named))?\s*[:\-]?\s*(.+)$/i,
    /(?:new\s+)?product\s+(?:called|named)\s+(.+)$/i,
    /add\s+(.+?)\s+as\s+(?:a\s+)?(?:new\s+)?product/i
  ];

  const matched =
    patterns
      .map(
        pattern =>
          prompt.match(
            pattern
          )?.[1] ??
          ''
      )
      .find(
        Boolean
      ) ??
    '';

  if (
    !matched
  ) {
    return '';
  }

  const name =
    matched.split(
      /\s+(?:(?:under|inside|within)\s+(?:the\s+)?(?:(?:category|subcategory)\s+)?|in\s+(?:the\s+)?(?:category|subcategory)\s+|category\s*[:\-]|subcategory\s*[:\-]|brand\s*[:\-]|priced\s+(?:at\s+)?|price\s*[:\-]|costing\s+|with\s+(?:a\s+)?price\b|with\s+stock\b|stock\s*[:\-]|quantity\s*[:\-])/i
    )[0] ??
    matched;

  return readableName(
    name
  ).slice(
    0,
    160
  );
}

function promptTokens(
  value:
    string
) {
  return new Set(
    normalize(
      value
    )
      .split(
        ' '
      )
      .filter(
        token =>
          token.length >
          2
      )
  );
}

function overlapScore(
  source:
    Set<string>,
  candidate:
    string
) {
  return normalize(
    candidate
  )
    .split(
      ' '
    )
    .filter(
      token =>
        source.has(
          token
        )
    ).length;
}

type ProductDraftCategory = {
  id:
    string;
  slug:
    string;
  label:
    string;
  subcategories:
    Array<{
      id:
        string;
      slug:
        string;
      label:
        string;
    }>;
};

type ProductDraftBrand = {
  id:
    string;
  slug:
    string;
  name:
    string;
};

function categoryAliasScore(
  prompt:
    string,
  category:
    ProductDraftCategory
) {
  const categoryIdentity =
    normalize(
      `${category.slug} ${category.label}`
    );

  const groups = [
    {
      promptTerms: [
        'wine',
        'champagne',
        'whisky',
        'whiskey',
        'vodka',
        'gin',
        'beer',
        'spirit',
        'liqueur',
        'drink'
      ],
      categoryTerms: [
        'wine',
        'liq',
        'drink',
        'beverage',
        'spirit',
        'alcohol'
      ]
    },
    {
      promptTerms: [
        'cake',
        'chocolate',
        'candy',
        'sweet',
        'biscuit',
        'cookie',
        'confectionery',
        'dessert'
      ],
      categoryTerms: [
        'sweet',
        'confection',
        'dessert',
        'bakery',
        'kitchen',
        'food'
      ]
    },
    {
      promptTerms: [
        'rice',
        'pasta',
        'oil',
        'food',
        'meal',
        'grocery',
        'kitchen',
        'sauce',
        'spice'
      ],
      categoryTerms: [
        'food',
        'kitchen',
        'grocery',
        'meal'
      ]
    },
    {
      promptTerms: [
        'party',
        'event',
        'celebration',
        'gift',
        'hamper'
      ],
      categoryTerms: [
        'party',
        'event',
        'gift',
        'plan'
      ]
    }
  ];

  return groups.reduce(
    (
      score,
      group
    ) => {
      const promptMatch =
        group.promptTerms.some(
          term =>
            prompt.includes(
              term
            )
        );

      const categoryMatch =
        group.categoryTerms.some(
          term =>
            categoryIdentity.includes(
              term
            )
        );

      return score +
        (
          promptMatch &&
          categoryMatch
            ? 30
            : 0
        );
    },
    0
  );
}

function matchProductCategory(
  prompt:
    string,
  name:
    string,
  categories:
    ProductDraftCategory[]
) {
  const normalizedPrompt =
    normalize(
      prompt
    );

  const tokens =
    promptTokens(
      `${prompt} ${name}`
    );

  const candidates =
    categories
      .filter(
        category =>
          ![
            'all',
            'featured',
            'deals'
          ].includes(
            category.slug
          )
      )
      .map(
        category => {
          const categoryLabel =
            normalize(
              category.label
            );

          const categorySlug =
            normalize(
              category.slug
            );

          const exactCategory =
            normalizedPrompt.includes(
              categoryLabel
            ) ||
            normalizedPrompt.includes(
              categorySlug
            );

          const matchedSubcategory =
            category.subcategories
              .map(
                subcategory => ({
                  subcategory,
                  score:
                    (
                      normalizedPrompt.includes(
                        normalize(
                          subcategory.label
                        )
                      ) ||
                      normalizedPrompt.includes(
                        normalize(
                          subcategory.slug
                        )
                      )
                        ? 80
                        : 0
                    ) +
                    overlapScore(
                      tokens,
                      `${subcategory.label} ${subcategory.slug}`
                    ) *
                      8
                })
              )
              .sort(
                (
                  left,
                  right
                ) =>
                  right.score -
                  left.score
              )[0] ??
            null;

          const score =
            (
              exactCategory
                ? 100
                : 0
            ) +
            overlapScore(
              tokens,
              `${category.label} ${category.slug}`
            ) *
              12 +
            categoryAliasScore(
              normalizedPrompt,
              category
            ) +
            (
              matchedSubcategory
                ?.score ??
              0
            );

          return {
            category,
            subcategory:
              matchedSubcategory &&
              matchedSubcategory.score >
                0
                ? matchedSubcategory.subcategory
                : null,
            score,
            exactCategory
          };
        }
      )
      .sort(
        (
          left,
          right
        ) =>
          right.score -
          left.score
      );

  const winner =
    candidates[0] ??
    null;

  if (
    !winner ||
    winner.score <
      20
  ) {
    return null;
  }

  return winner;
}

function matchProductBrand(
  prompt:
    string,
  name:
    string,
  brands:
    ProductDraftBrand[]
) {
  const source =
    normalize(
      `${prompt} ${name}`
    );

  return brands
    .map(
      brand => {
        const identity =
          normalize(
            `${brand.name} ${brand.slug}`
          );

        return {
          brand,
          score:
            (
              source.includes(
                normalize(
                  brand.name
                )
              )
                ? 100
                : 0
            ) +
            overlapScore(
              promptTokens(
                source
              ),
              identity
            ) *
              10
        };
      }
    )
    .filter(
      item =>
        item.score >
        0
    )
    .sort(
      (
        left,
        right
      ) =>
        right.score -
        left.score
    )[0]?.brand ??
    null;
}

function estimatedDeliveryFromPrompt(
  prompt:
    string
) {
  return prompt.match(
    /(\d+\s*(?:-|–|to)\s*\d+\s*(?:business\s+)?days?)/i
  )?.[1] ??
    null;
}

async function recognizeProductDraft(
  prompt:
    string
): Promise<{
  draft:
    AIAssistantRecognizedProductDraft |
    null;
  missing:
    string[];
}> {
  const [
    categories,
    brands
  ] =
    await Promise.all([
      prisma.category.findMany({
        where: {
          active:
            true
        },
        orderBy: {
          position:
            'asc'
        },
        select: {
          id:
            true,
          slug:
            true,
          label:
            true,
          subcategories: {
            where: {
              active:
                true
            },
            orderBy: {
              position:
                'asc'
            },
            select: {
              id:
                true,
              slug:
                true,
              label:
                true
            }
          }
        }
      }),
      prisma.brand.findMany({
        where: {
          active:
            true
        },
        orderBy: {
          name:
            'asc'
        },
        select: {
          id:
            true,
          slug:
            true,
          name:
            true
        }
      })
    ]);

  const name =
    extractProductName(
      prompt
    );

  const categoryMatch =
    name
      ? matchProductCategory(
          prompt,
          name,
          categories
        )
      : null;

  const missing:
    string[] = [];

  if (!name) {
    missing.push(
      'product name'
    );
  }

  if (!categoryMatch) {
    missing.push(
      'matching category'
    );
  }

  if (
    !name ||
    !categoryMatch
  ) {
    return {
      draft:
        null,
      missing
    };
  }

  const brand =
    matchProductBrand(
      prompt,
      name,
      brands
    );

  const category =
    categoryMatch.category;

  const subcategory =
    categoryMatch.subcategory;

  const tokens =
    [
      ...new Set(
        [
          ...normalize(
            name
          )
            .split(
              ' '
            )
            .filter(
              token =>
                token.length >
                2
            ),
          category.slug,
          subcategory?.slug ??
            null,
          brand?.slug ??
            null
        ].filter(
          (
            value
          ): value is string =>
            Boolean(
              value
            )
        )
      )
    ].slice(
      0,
      14
    );

  const assumptions = [
    `Matched category: ${category.label}.`,
    subcategory
      ? `Matched subcategory: ${subcategory.label}.`
      : 'No subcategory was confidently identified.',
    brand
      ? `Matched brand: ${brand.name}.`
      : 'No existing brand was confidently identified.',
    'The Product will be created as an inactive Draft with no price, stock, variant or media until Product Studio is completed.'
  ];

  const confidence =
    Math.min(
      0.96,
      0.58 +
      (
        categoryMatch.exactCategory
          ? 0.2
          : 0.08
      ) +
      (
        brand
          ? 0.08
          : 0
      ) +
      (
        subcategory
          ? 0.06
          : 0
      )
    );

  return {
    missing,
    draft: {
      name,
      slug:
        slugValue(
          name
        ),
      categoryId:
        category.id,
      categoryLabel:
        category.label,
      subcategoryId:
        subcategory?.id ??
        null,
      subcategoryLabel:
        subcategory?.label ??
        null,
      brandId:
        brand?.id ??
        null,
      brandName:
        brand?.name ??
        null,
      shortDescription:
        `${name} is a ${category.label.toLowerCase()} selection prepared as an Shelsea Product Studio draft.`,
      longDescription:
        `${name} has been recognised as a ${category.label.toLowerCase()} product${brand ? ` from ${brand.name}` : ''}. Complete its media, variants, price, stock and final customer-facing description in Product Studio before submission or publication.`,
      estimatedDelivery:
        estimatedDeliveryFromPrompt(
          prompt
        ),
      tags:
        tokens,
      recognitionConfidence:
        confidence,
      assumptions
    }
  };
}

async function productCreationResponse({
  access,
  prompt
}: EngineInput) {
  const {
    draft,
    missing
  } =
    await recognizeProductDraft(
      prompt
    );

  const productStudioHref =
    access.audience ===
    'admin'
      ? '/admin/products/new'
      : '/vendor/products/new';

  if (!draft) {
    return response({
      headline:
        'Tell me a little more about the Product',
      summary:
        `I recognised that you want to create a Product, but I still need ${missing.join(' and ')} before I can prepare a safe draft.`,
      outputType:
        'CATALOG_DRAFT',
      confidence:
        0.42,
      sections: [
        {
          title:
            'Use a clear request',
          bullets: [
            'Include the exact Product name.',
            'Mention an existing category or subcategory.',
            'Mention the brand when it already exists in Shelsea.',
            'Price, stock, variants and media can be completed later in Product Studio.'
          ]
        }
      ],
      warnings: [
        'No Product record has been created.'
      ],
      suggestedPrompts: [
        'Create a new product called Moët Nectar Impérial under Wines',
        'Add Golden Penny Spaghetti as a product in Kitchen',
        'Create a product draft called Celebration Chocolate Box in Confectionery'
      ],
      actions: [
        {
          label:
            'Open Product Studio',
          href:
            productStudioHref,
          kind:
            'primary'
        }
      ]
    });
  }

  return response({
    headline:
      `Product draft ready: ${draft.name}`,
    summary:
      `I matched this Product to ${draft.categoryLabel}${draft.brandName ? ` and ${draft.brandName}` : ''}. Review the recognised details below before creating the inactive Product Studio draft.`,
    outputType:
      'CATALOG_DRAFT',
    confidence:
      draft.recognitionConfidence,
    productDraft:
      draft,
    metrics: [
      {
        label:
          'Category',
        value:
          draft.categoryLabel
      },
      {
        label:
          'Brand',
        value:
          draft.brandName ??
          'Not matched'
      },
      {
        label:
          'Status',
        value:
          'Draft'
      }
    ],
    draftFields: [
      {
        label:
          'Product name',
        value:
          draft.name
      },
      {
        label:
          'Category',
        value:
          draft.categoryLabel
      },
      {
        label:
          'Subcategory',
        value:
          draft.subcategoryLabel ??
          'None matched'
      },
      {
        label:
          'Brand',
        value:
          draft.brandName ??
          'None matched'
      },
      {
        label:
          'Short description',
        value:
          draft.shortDescription
      },
      {
        label:
          'Long description',
        value:
          draft.longDescription
      },
      {
        label:
          'Tags',
        value:
          draft.tags.join(
            ', '
          )
      }
    ],
    sections: [
      {
        title:
          'Recognition notes',
        bullets:
          draft.assumptions
      },
      {
        title:
          'What happens after creation',
        bullets: [
          'The Product is created as an inactive Draft.',
          'No price, stock, media or active variant is invented.',
          'Product Studio remains responsible for completion.',
          'Publication still follows the normal approval boundary.'
        ]
      }
    ],
    suggestedPrompts: [
      `Create another Product in ${draft.categoryLabel}`,
      'Help me write the final Product description',
      'Explain what Product details are still missing'
    ],
    actions: [
      {
        label:
          'Open Product Studio',
        href:
          productStudioHref,
        kind:
          'primary'
      }
    ]
  });
}

function availableQuantity(
  product:
    ProductRecord
) {
  return product.variants.reduce(
    (
      total,
      variant
    ) =>
      total +
      Math.max(
        0,
        (
          variant.inventory
            ?.quantity ??
          0
        ) -
          (
            variant.inventory
              ?.reserved ??
            0
          )
      ),
    0
  );
}

/* AJ_MS12_PRODUCT_LIBRARY_PRESENTATION_V1 */
function productCard(
  product:
    ProductRecord,
  reason:
    string
): AIAssistantProduct {
  const variant =
    product.variants.find(
      item =>
        (
          item.inventory
            ?.quantity ??
          0
        ) -
          (
            item.inventory
              ?.reserved ??
            0
          ) >
        0
    ) ??
    product.variants[0] ??
    null;

  const image =
    product.images[0]
      ?.url ??
    variant?.image ??
    null;

  const available =
    availableQuantity(
      product
    );

  const overview =
    product.shortDescription
      ?.trim() ||
    null;

  const description =
    product.longDescription
      ?.trim() ||
    overview;

  const specifications = [
    {
      label:
        'Category',
      value:
        product.category.label
    },
    ...(
      product.brand?.name
        ? [
            {
              label:
                'Brand',
              value:
                product.brand.name
            }
          ]
        : []
    ),
    ...(
      variant?.label
        ? [
            {
              label:
                'Selected variant',
              value:
                variant.label
            }
          ]
        : []
    ),
    ...(
      variant?.sku
        ? [
            {
              label:
                'SKU',
              value:
                variant.sku
            }
          ]
        : []
    ),
    ...(
      product.estimatedDelivery
        ? [
            {
              label:
                'Estimated delivery',
              value:
                product.estimatedDelivery
            }
          ]
        : []
    ),
    {
      label:
        'Current availability',
      value:
        `${available} available`
    },
    {
      label:
        'Customer rating',
      value:
        product.reviewsCount >
        0
          ? `${product.rating.toFixed(1)} from ${product.reviewsCount} reviews`
          : `${product.rating.toFixed(1)} rating; no published review count`
    }
  ];

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    image,
    category:
      product.category.label,
    brand:
      product.brand?.name ??
      null,
    variantId:
      variant?.id ??
      null,
    variantLabel:
      variant?.label ??
      null,
    price:
      variant
        ? Number(
            variant.price
          )
        : null,
    available,
    rating:
      product.rating,
    reason,
    href:
      `/store?product=${encodeURIComponent(
        product.slug
      )}`,
    library: {
      status:
        'CATALOG_ONLY',
      overview,
      description,
      tags:
        product.tags,
      specifications,
      ingredients: [],
      safetyNotes: [],
      sources: [
        {
          type:
            'CATALOG',
          title:
            'Shelsea live marketplace catalogue',
          verified:
            true
        }
      ],
      missingInformation: [
        'Verified vendor or manufacturer knowledge record',
        'Ingredients, composition or technical details where applicable',
        'Product-specific safety guidance where applicable',
        'External educational enrichment and provenance'
      ]
    }
  };
}



function promptTitle(
  prompt: string
) {
  const clean =
    prompt
      .replace(
        /\s+/g,
        ' '
      )
      .trim();

  if (
    clean.length <=
    68
  ) {
    return clean;
  }

  return `${clean.slice(
    0,
    65
  )}…`;
}

function response(
  input: {
    headline:
      string;
    summary:
      string;
    outputType:
      AIAssistantOutputType;
    confidence?:
      number;
    metrics?:
      AIAssistantMetric[];
    products?:
      AIAssistantProduct[];
    productDraft?:
      AIAssistantRecognizedProductDraft |
      null;
    sections?:
      AIAssistantSection[];
    draftFields?:
      AIAssistantDraftField[];
    warnings?:
      string[];
    suggestedPrompts?:
      string[];
    actions?:
      AIAssistantAction[];
  }
): AIAssistantResponsePayload {
  return {
    headline:
      input.headline,
    summary:
      input.summary,
    outputType:
      input.outputType,
    confidence:
      input.confidence ??
      0.74,
    metrics:
      input.metrics ??
      [],
    products:
      input.products ??
      [],
    productDraft:
      input.productDraft ??
      null,
    sections:
      input.sections ??
      [],
    draftFields:
      input.draftFields ??
      [],
    warnings:
      input.warnings ??
      [],
    suggestedPrompts:
      input.suggestedPrompts ??
      [],
    actions:
      input.actions ??
      []
  };
}

function classifyCustomer(
  prompt: string
): AIAssistantOutputType {
  if (
    includesAny(
      prompt,
      [
        'compare',
        'difference',
        'better between',
        'versus',
        ' vs '
      ]
    )
  ) {
    return 'COMPARISON';
  }

  if (
    includesAny(
      prompt,
      [
        'pair',
        'dinner',
        'gift',
        'occasion',
        'celebration',
        'basket',
        'party'
      ]
    )
  ) {
    return 'PAIRING';
  }

  if (
    includesAny(
      prompt,
      [
        'shopping list',
        'plan',
        'quantities',
        'essentials',
        'checklist'
      ]
    )
  ) {
    return 'SHOPPING_PLAN';
  }

  return 'RECOMMENDATION';
}

function classifyAdmin(
  prompt: string
): AIAssistantOutputType {
  if (
    includesAny(
      prompt,
      [
        'catalog',
        'listing',
        'description',
        'tags',
        'missing product',
        'product quality'
      ]
    )
  ) {
    return 'CATALOG_DRAFT';
  }

  if (
    includesAny(
      prompt,
      [
        'campaign',
        'promotion',
        'collection',
        'story',
        'reel',
        'banner',
        'merchandising'
      ]
    )
  ) {
    return 'CAMPAIGN_DRAFT';
  }

  if (
    includesAny(
      prompt,
      [
        'permission',
        'approve',
        'governance',
        'authority',
        'policy'
      ]
    )
  ) {
    return 'GOVERNANCE_EXPLANATION';
  }

  return 'OPERATIONS_BRIEF';
}

function classifyVendor(
  prompt: string
): AIAssistantOutputType {
  if (
    includesAny(
      prompt,
      [
        'campaign',
        'promotion',
        'collection',
        'story',
        'reel',
        'bundle'
      ]
    )
  ) {
    return 'CAMPAIGN_DRAFT';
  }

  if (
    includesAny(
      prompt,
      [
        'approval',
        'ready',
        'submission',
        'blocker',
        'policy'
      ]
    )
  ) {
    return 'GOVERNANCE_EXPLANATION';
  }

  return 'CATALOG_DRAFT';
}

function qualityIssues(
  product:
    ProductRecord
) {
  const issues:
    string[] = [];

  if (
    !product.shortDescription?.trim()
  ) {
    issues.push(
      'short description'
    );
  }

  if (
    !product.longDescription?.trim()
  ) {
    issues.push(
      'long description'
    );
  }

  if (
    product.tags.length <
    3
  ) {
    issues.push(
      'search tags'
    );
  }

  if (
    !product.images.length
  ) {
    issues.push(
      'product media'
    );
  }

  if (
    !product.variants.length
  ) {
    issues.push(
      'active variants'
    );
  }

  if (
    product.variants.some(
      variant =>
        !variant.inventory
    )
  ) {
    issues.push(
      'inventory connection'
    );
  }

  return issues;
}

type PlanCompositionPreference =
  | 'AFFORDABLE'
  | 'BALANCED'
  | 'PREMIUM'
  | null;

type PlanCompositionConstraints = {
  budget:
    number |
    null;
  flexibleBudget:
    boolean;
  guestCount:
    number |
    null;
  preference:
    PlanCompositionPreference;
  reduceCost:
    boolean;
  requestAlternative:
    boolean;
  nonAlcoholic:
    boolean;
  nonAlcoholicMinimum:
    number;
  alcoholFreeOnly:
    boolean;
  contextText:
    string;
  exclusionTerms:
    string[];
};

type RankedProduct = {
  product:
    ProductRecord;
  score:
    number;
  marketplace:
    MarketplaceProductSignal;
};

function availableVariant(
  product:
    ProductRecord
) {
  return (
    product.variants.find(
      variant =>
        (
          variant.inventory
            ?.quantity ??
          0
        ) -
          (
            variant.inventory
              ?.reserved ??
            0
          ) >
        0
    ) ??
    product.variants[0] ??
    null
  );
}

function productUnitPrice(
  product:
    ProductRecord
) {
  const variant =
    availableVariant(
      product
    );

  return variant
    ? Number(
        variant.price
      )
    : null;
}

function formatNaira(
  value:
    number
) {
  return `₦${Math.max(
    0,
    Math.round(
      value
    )
  ).toLocaleString(
    'en-NG'
  )}`;
}

function numericBudget(
  value:
    string
) {
  return parseNairaAmount(
    value
  );
}


type RelativeBudgetAdjustment =
  | 'INCREASE'
  | null;

function relativeBudgetAdjustment(
  prompt:
    string
): RelativeBudgetAdjustment {
  if (
    numericBudget(
      prompt
    )
  ) {
    return null;
  }

  const normalized =
    normalize(
      prompt
    );

  if (
    /(?:\b(?:increase|raise|expand|boost|enlarge)\b[^.!?\n]{0,30}\bbudget\b|\bbudget\b[^.!?\n]{0,30}\b(?:increase|higher|larger|bigger|too low|too small|not enough)\b|\bspend\s+more\b|\bgive\s+(?:it|the\s+plan|this\s+plan)\s+more\s+(?:budget|room)\b)/.test(
      normalized
    )
  ) {
    return 'INCREASE';
  }

  return null;
}

function planMetricAmount(
  plan:
    AIAssistantResponsePayload,
  label:
    string
) {
  const value =
    plan.metrics.find(
      metric =>
        metric.label ===
        label
    )?.value;

  if (
    !value
  ) {
    return null;
  }

  return numericBudget(
    `${label} ${value}`
  );
}

function roundBudgetGuidance(
  value:
    number
) {
  return Math.max(
    5_000,
    Math.ceil(
      value /
        5_000
    ) *
      5_000
  );
}

function relativeBudgetClarificationResponse(
  plan:
    AIAssistantResponsePayload
) {
  const currentBudget =
    planMetricAmount(
      plan,
      'Budget limit'
    );

  const currentTotal =
    planMetricAmount(
      plan,
      'Estimated total'
    ) ??
    priorPlanTotal(
      plan
    );

  const productCount =
    plan.products.length;

  const currentAuthority =
    currentBudget ??
    Math.max(
      currentTotal,
      1
    );

  const estimatedItemValue =
    productCount >
      0
      ? currentTotal /
        productCount
      : currentAuthority *
        0.2;

  const firstGuidedBudget =
    roundBudgetGuidance(
      Math.max(
        currentAuthority *
          1.15,
        currentTotal +
          Math.max(
            5_000,
            estimatedItemValue *
              0.45
          )
      )
    );

  const secondGuidedBudget =
    roundBudgetGuidance(
      Math.max(
        firstGuidedBudget +
          10_000,
        currentAuthority *
          1.35
      )
    );

  const thirdGuidedBudget =
    roundBudgetGuidance(
      Math.max(
        secondGuidedBudget +
          15_000,
        currentAuthority *
          1.6
      )
    );

  return response({
    headline:
      'How much should I raise the budget?',
    summary:
      `I understood that ${productCount || 'the current number of'} product${productCount === 1 ? '' : 's'} feel${productCount === 1 ? 's' : ''} too small. The active limit is ${currentBudget ? formatNaira(currentBudget) : 'not yet confirmed'}, so I paused before spending beyond it.`,
    outputType:
      plan.outputType,
    confidence:
      0.92,
    metrics:
      plan.metrics,
    products:
      plan.products,
    sections: [
      {
        title:
          'Still open',
        bullets: [
          'What budget would you like me to work within?'
        ]
      },
      {
        title:
          'Why I paused',
        bullets: [
          currentBudget
            ? `Your saved budget remains ${formatNaira(currentBudget)} until you confirm a higher ceiling.`
            : 'A new spending ceiling is required before I rebuild the plan.',
          'A higher budget can support more matching products, but AJ should not choose how much more you are willing to spend without your confirmation.'
        ]
      }
    ],
    warnings: [
      'The active Plan, selected products and budget remain unchanged until a new limit is confirmed.'
    ],
    suggestedPrompts: [
      `Increase the budget to ${formatNaira(firstGuidedBudget)}`,
      `Increase the budget to ${formatNaira(secondGuidedBudget)}`,
      `Increase the budget to ${formatNaira(thirdGuidedBudget)}`,
      'Use a flexible budget'
    ],
    actions: []
  });
}

function audienceCount(
  value:
    string
) {
  const matches =
    [
      ...value.matchAll(
        /(?:for|we(?:\s+are|'re)?|plan(?:ning)?\s+for)?\s*(\d{1,4})\s*(?:people|persons|guests|attendees)\b/gi
      )
    ];

  const match =
    matches.at(
      -1
    );

  if (
    !match
  ) {
    return null;
  }

  const count =
    Number(
      match[1]
    );

  return Number.isFinite(
    count
  ) &&
    count >
      0
    ? count
    : null;
}

function lastPreference(
  value:
    string
): PlanCompositionPreference {
  const normalized =
    normalize(
      value
    );

  const candidates = [
    {
      key:
        'AFFORDABLE' as const,
      index:
        Math.max(
          normalized.lastIndexOf(
            'affordable'
          ),
          normalized.lastIndexOf(
            'cheaper'
          ),
          normalized.lastIndexOf(
            'lower cost'
          ),
          normalized.lastIndexOf(
            'reduce cost'
          )
        )
    },
    {
      key:
        'BALANCED' as const,
      index:
        normalized.lastIndexOf(
          'balanced'
        )
    },
    {
      key:
        'PREMIUM' as const,
      index:
        normalized.lastIndexOf(
          'premium'
        )
    }
  ]
    .filter(
      item =>
        item.index >=
        0
    )
    .sort(
      (
        left,
        right
      ) =>
        right.index -
        left.index
    );

  return candidates[0]?.key ??
    null;
}

const planCountWords:
  Record<
    string,
    number
  > = {
    one:
      1,
    two:
      2,
    three:
      3,
    four:
      4,
    five:
      5,
    six:
      6,
    seven:
      7,
    eight:
      8
  };

function requestedNonAlcoholicMinimum(
  value:
    string
) {
  const normalized =
    normalize(
      value
    );

  const matches =
    [
      ...normalized.matchAll(
        /\b(?:include|add|with|need|want)?\s*(?:at\s+least|minimum\s+of)?\s*(\d+|one|two|three|four|five|six|seven|eight)\s+non[-\s]+alcoholic\b/g
      )
    ];

  const countValue =
    matches.at(
      -1
    )?.[1] ??
    null;

  if (
    countValue
  ) {
    const numeric =
      Number(
        countValue
      );

    return Math.min(
      8,
      Math.max(
        1,
        Number.isFinite(
          numeric
        )
          ? numeric
          : planCountWords[
              countValue
            ] ??
            1
      )
    );
  }

  return /(?:non[-\s]+alcoholic|without\s+alcohol|no\s+alcohol)/.test(
    normalized
  )
    ? 1
    : 0;
}

function resolvePlanCompositionConstraints(
  input: {
    state:
      AIAssistantJourneyState |
      null;
    conversation:
      string[];
    prompt:
      string;
    confirmedBudget?:
      number |
      null;
  }
): PlanCompositionConstraints {
  const stateParts = [
    input.state?.objective ??
      '',
    ...(
      input.state?.confirmedContext ??
      []
    ),
    ...(
      input.state?.constraints ??
      []
    ),
    ...(
      input.state?.preferences ??
      []
    ),
    ...(
      input.state?.rejectedSuggestions ??
      []
    ),
    input.state?.latestInstruction ??
      ''
  ];

  const allText =
    [
      ...input.conversation,
      ...stateParts,
      input.prompt
    ].join(
      ' '
    );

  const latestDirection =
    [
      input.state?.latestInstruction ??
        '',
      input.prompt
    ].join(
      ' '
    );

  const normalizedAll =
    normalize(
      allText
    );

  const normalizedLatest =
    normalize(
      latestDirection
    );

  const latestFlexibleBudget =
    /(?:budget\s+is\s+flexible|flexible\s+budget|optimise\s+freely|optimize\s+freely)/i.test(
      input.prompt
    );

  const savedFixedBudget =
    numericBudget(
      (
        input.state
          ?.constraints ??
        []
      ).join(
        ' '
      )
    );

  const fixedBudgetAuthority =
    input.confirmedBudget ??
    (
      latestFlexibleBudget
        ? null
        : savedFixedBudget
    );

  const flexibleBudget =
    latestFlexibleBudget ||
    (
      fixedBudgetAuthority ===
        null &&
      /(?:budget\s+is\s+flexible|flexible\s+budget|optimise\s+freely|optimize\s+freely)/i.test(
        allText
      ) &&
      !numericBudget(
        latestDirection
      )
    );

  const explicitExclusionTerms =
    (
      input.state?.rejectedSuggestions ??
      []
    )
      .concat(
        input.state?.constraints ??
        []
      )
      .map(
        value =>
          normalize(
            value
          )
      )
      .flatMap(
        value => {
          if (
            !/(?:avoid|without|exclude|remove|no\s+)/.test(
              value
            )
          ) {
            return [];
          }

          return [
            'wine',
            'champagne',
            'whisky',
            'cognac',
            'alcohol',
            'chocolate',
            'snacks'
          ].filter(
            term =>
              value.includes(
                term
              )
          );
        }
      );

  const nonAlcoholicMinimum =
    requestedNonAlcoholicMinimum(
      allText
    );

  const alcoholFreeOnly =
    /(?:without\s+alcohol|no\s+alcohol|only\s+non[-\s]+alcoholic|all\s+non[-\s]+alcoholic|fully\s+non[-\s]+alcoholic|entirely\s+non[-\s]+alcoholic)/.test(
      normalizedAll
    );

  return {
    budget:
      flexibleBudget
        ? null
        : fixedBudgetAuthority ??
          numericBudget(
            allText
          ),
    flexibleBudget,
    guestCount:
      audienceCount(
        allText
      ),
    preference:
      lastPreference(
        allText
      ),
    reduceCost:
      /(?:remove\s+premium|reduce\s+cost|lower\s+cost|more\s+affordable|make\s+(?:it|this|the\s+plan)\s+cheaper|cheaper\s+version|cut\s+(?:the\s+)?cost)/.test(
        normalizedLatest
      ),
    requestAlternative:
      /(?:another|different|alternative|replace|swap)/.test(
        normalizedLatest
      ),
    nonAlcoholic:
      nonAlcoholicMinimum >
        0 ||
      alcoholFreeOnly,
    nonAlcoholicMinimum,
    alcoholFreeOnly,
    contextText:
      normalizedAll,
    exclusionTerms:
      [
        ...new Set(
          explicitExclusionTerms
        )
      ]
  };
}

function productPlanText(
  product:
    ProductRecord
) {
  return normalize(
    [
      product.name,
      product.category.label,
      product.category.slug,
      product.brand?.name ??
        '',
      product.shortDescription ??
        '',
      product.longDescription ??
        ''
    ].join(
      ' '
    )
  );
}

function alcoholicPlanProduct(
  product:
    ProductRecord
) {
  return /(?:\bwine\b|\bchampagne\b|\bwhisky\b|\bwhiskey\b|\bcognac\b|\bvodka\b|\brum\b|\bgin\b|\btequila\b|\bbaileys\b|\bmartell\b|\bhennessy\b|\balcohol\b)/.test(
    productPlanText(
      product
    )
  );
}

function planRelevanceScore(
  product:
    ProductRecord,
  constraints:
    PlanCompositionConstraints
) {
  const productText =
    productPlanText(
      product
    );

  const context =
    constraints.contextText;

  let score =
    0;

  const birthdayPlanning =
    /(?:birthday|celebration|party)/.test(
      context
    );

  const dinnerPlanning =
    /(?:dinner|meal|food|serve|guests)/.test(
      context
    );

  if (
    birthdayPlanning
  ) {
    if (
      /(?:birthday|party plans|celebration|cake|confection|chocolate|dessert)/.test(
        productText
      )
    ) {
      score +=
        64;
    }

    if (
      /(?:wine|champagne|baileys|martell|drink|beverage)/.test(
        productText
      )
    ) {
      score +=
        26;
    }

    if (
      /(?:corporate|vip lounge|office)/.test(
        productText
      )
    ) {
      score -=
        72;
    }
  }

  if (
    dinnerPlanning &&
    /(?:kitchen meals|meal|food|wine|drink|beverage|party plans)/.test(
      productText
    )
  ) {
    score +=
      24;
  }

  if (
    /(?:stand mixer|mixer|air fryer|appliance|equipment|kitchenaid artisan)/.test(
      productText
    )
  ) {
    score -=
      110;
  }

  if (
    constraints.alcoholFreeOnly &&
    alcoholicPlanProduct(
      product
    )
  ) {
    score -=
      500;
  } else if (
    constraints.nonAlcoholicMinimum >
      0 &&
    alcoholicPlanProduct(
      product
    )
  ) {
    score -=
      60;
  }

  if (
    constraints.exclusionTerms.some(
      term =>
        productText.includes(
          term
        )
    )
  ) {
    score -=
      240;
  }

  return score;
}

function priorPlanTotal(
  previousPlan:
    AIAssistantResponsePayload |
    null
) {
  return (
    previousPlan?.products ??
    []
  ).reduce(
    (
      total,
      product
    ) =>
      total +
      (
        product.price ??
        0
      ),
    0
  );
}

function composeShoppingPlan(
  input: {
    ranked:
      RankedProduct[];
    constraints:
      PlanCompositionConstraints;
    previousPlan:
      AIAssistantResponsePayload |
      null;
    marketplaceResolution:
      MarketplaceRequestResolution;
  }
) {
  const previousIds =
    new Set(
      (
        input.previousPlan?.products ??
        []
      ).map(
        product =>
          product.id
      )
    );

  const previousTotal =
    priorPlanTotal(
      input.previousPlan
    );

  const budgetLimit =
    input.constraints.budget;

  const targetBudget =
    input.constraints.reduceCost &&
    previousTotal >
      0
      ? Math.min(
          budgetLimit ??
            previousTotal,
          Math.max(
            1,
            Math.floor(
              previousTotal *
                0.7
            )
          )
        )
      : budgetLimit;

  const individualCap =
    targetBudget
      ? input.constraints.reduceCost ||
        input.constraints.preference ===
          'AFFORDABLE'
        ? targetBudget *
          0.45
        : input.constraints.preference ===
            'BALANCED'
          ? targetBudget *
            0.6
          : targetBudget
      : null;

  const candidates =
    input.ranked
      .map(
        item => {
          const price =
            productUnitPrice(
              item.product
            );

          const relevance =
            planRelevanceScore(
              item.product,
              input.constraints
            );

          const previousPenalty =
            input.constraints
              .requestAlternative &&
            previousIds.has(
              item.product.id
            )
              ? 120
              : 0;

          const pricePenalty =
            (
              input.constraints.reduceCost ||
              input.constraints.preference ===
                'AFFORDABLE'
            ) &&
            price
              ? price /
                1_000 *
                0.16
              : 0;

          return {
            ...item,
            price,
            relevance,
            adjustedScore:
              item.score +
              relevance -
              previousPenalty -
              pricePenalty
          };
        }
      )
      .filter(
        item =>
          !item.marketplace
            .excluded &&
          availableQuantity(
            item.product
          ) >
            0 &&
          item.price !==
            null &&
          item.price >
            0 &&
          item.relevance >
            -80 &&
          (
            !targetBudget ||
            item.price <=
              targetBudget
          ) &&
          (
            !individualCap ||
            item.price <=
              individualCap
          ) &&
          (
            !input.constraints
              .alcoholFreeOnly ||
            !alcoholicPlanProduct(
              item.product
            )
          )
      )
      .sort(
        (
          left,
          right
        ) =>
          right.adjustedScore -
          left.adjustedScore ||
          (
            left.price ??
            Number.MAX_SAFE_INTEGER
          ) -
            (
              right.price ??
              Number.MAX_SAFE_INTEGER
            )
      );

  const selectedRecords:
    typeof candidates = [];

  const selectedIds =
    new Set<string>();

  let estimatedTotal =
    0;

  function canSelect(
    candidate:
      typeof candidates[number]
  ) {
    if (
      selectedRecords.length >=
        8 ||
      selectedIds.has(
        candidate.product.id
      )
    ) {
      return false;
    }

    if (
      candidate.marketplace
        .deprioritized
    ) {
      const candidateConcepts =
        new Set(
          candidate.marketplace
            .matchedConcepts
        );

      const alreadySelectedForConcept =
        selectedRecords.some(
          item =>
            item.marketplace
              .deprioritized &&
            item.marketplace
              .matchedConcepts
              .some(
                concept =>
                  candidateConcepts.has(
                    concept
                  )
              )
        );

      if (
        alreadySelectedForConcept
      ) {
        return false;
      }
    }

    if (
      targetBudget &&
      estimatedTotal +
        (
          candidate.price ??
          0
        ) >
        targetBudget
    ) {
      return false;
    }

    return true;
  }

  function selectCandidate(
    candidate:
      typeof candidates[number]
  ) {
    if (
      !canSelect(
        candidate
      )
    ) {
      return false;
    }

    selectedRecords.push(
      candidate
    );

    selectedIds.add(
      candidate.product.id
    );

    estimatedTotal +=
      candidate.price ??
      0;

    return true;
  }

  const requiredNonAlcoholic =
    Math.min(
      8,
      Math.max(
        0,
        input.constraints
          .nonAlcoholicMinimum
      )
    );

  for (
    const candidate of
    candidates.filter(
      item =>
        !alcoholicPlanProduct(
          item.product
        )
    )
  ) {
    const selectedNonAlcoholic =
      selectedRecords.filter(
        item =>
          !alcoholicPlanProduct(
            item.product
          )
      ).length;

    if (
      selectedNonAlcoholic >=
        requiredNonAlcoholic
    ) {
      break;
    }

    selectCandidate(
      candidate
    );
  }

  /* AJ_MS12_4_SOFT_DECREASE_PRESERVATION_V1 */
  const decreasedConcepts =
    [
      ...new Set(
        input.marketplaceResolution
          .directions
          .filter(
            direction =>
              direction.direction ===
              'DECREASE'
          )
          .map(
            direction =>
              direction.concept
          )
      )
    ];

  for (
    const concept of
    decreasedConcepts
  ) {
    const reducedCandidates =
      candidates
        .filter(
          item =>
            item.marketplace
              .deprioritized &&
            item.marketplace
              .matchedConcepts
              .includes(
                concept
              )
        )
        .sort(
          (
            left,
            right
          ) =>
            (
              left.price ??
              Number.MAX_SAFE_INTEGER
            ) -
              (
                right.price ??
                Number.MAX_SAFE_INTEGER
              ) ||
            right.adjustedScore -
              left.adjustedScore
        );

    for (
      const candidate of
      reducedCandidates
    ) {
      if (
        selectCandidate(
          candidate
        )
      ) {
        break;
      }
    }
  }

  const preferredCandidateCount =
    candidates.filter(
      item =>
        item.marketplace
          .preferred
    ).length;

  const preferredMinimum =
    preferredCandidateCount >
      0
      ? Math.min(
          4,
          Math.max(
            2,
            Math.ceil(
              Math.min(
                8,
                candidates.length
              ) *
                0.5
            )
          )
        )
      : 0;

  for (
    const candidate of
    candidates.filter(
      item =>
        item.marketplace
          .preferred
    )
  ) {
    const selectedPreferred =
      selectedRecords.filter(
        item =>
          item.marketplace
            .preferred
      ).length;

    if (
      selectedPreferred >=
      preferredMinimum
    ) {
      break;
    }

    selectCandidate(
      candidate
    );
  }

  for (
    const candidate of
    candidates
  ) {
    selectCandidate(
      candidate
    );
  }

  if (
    selectedRecords.length <
      2 &&
    targetBudget
  ) {
    const cheapest:
      typeof candidates =
      input.ranked
        .map(
          item => {
            const price =
              productUnitPrice(
                item.product
              );

            const relevance =
              planRelevanceScore(
                item.product,
                input.constraints
              );

            return {
              ...item,
              price,
              relevance,
              adjustedScore:
                item.score +
                relevance
            };
          }
        )
        .filter(
          item =>
            !item.marketplace
              .excluded &&
            availableQuantity(
              item.product
            ) >
              0 &&
            item.price !==
              null &&
            item.price >
              0 &&
            item.price <=
              targetBudget &&
            item.relevance >
              -80 &&
            (
              !input.constraints
                .alcoholFreeOnly ||
              !alcoholicPlanProduct(
                item.product
              )
            )
        )
        .sort(
          (
            left,
            right
          ) =>
            Number(
              right.marketplace
                .preferred
            ) -
              Number(
                left.marketplace
                  .preferred
              ) ||
            Number(
              left.marketplace
                .deprioritized
            ) -
              Number(
                right.marketplace
                  .deprioritized
              ) ||
            (
              left.price ??
              Number.MAX_SAFE_INTEGER
            ) -
            (
              right.price ??
              Number.MAX_SAFE_INTEGER
            )
        );

    selectedRecords.length =
      0;

    selectedIds.clear();

    estimatedTotal =
      0;

    for (
      const candidate of
      cheapest.filter(
        item =>
          !alcoholicPlanProduct(
            item.product
          )
      )
    ) {
      const selectedNonAlcoholic =
        selectedRecords.filter(
          item =>
            !alcoholicPlanProduct(
              item.product
            )
        ).length;

      if (
        selectedNonAlcoholic >=
          requiredNonAlcoholic
      ) {
        break;
      }

      selectCandidate(
        candidate
      );
    }

    for (
      const candidate of
      cheapest
    ) {
      selectCandidate(
        candidate
      );
    }
  }

  const orderedSelectedRecords =
    [
      ...selectedRecords
    ].sort(
      (
        left,
        right
      ) =>
        Number(
          right.marketplace
            .preferred
        ) -
          Number(
            left.marketplace
              .preferred
          ) ||
        Number(
          left.marketplace
            .deprioritized
        ) -
          Number(
            right.marketplace
              .deprioritized
          ) ||
        right.adjustedScore -
          left.adjustedScore
    );

  const selected =
    orderedSelectedRecords.map(
      (
        item,
        index
      ) =>
        productCard(
          item.product,
          marketplaceReason(
            item.marketplace,
            index ===
              0
              ? 'Strongest occasion-relevant match within the active plan constraints.'
              : input.constraints
                  .nonAlcoholicMinimum >
                  0 &&
                !alcoholicPlanProduct(
                  item.product
                )
                ? 'Included to satisfy the requested non-alcoholic minimum.'
                : 'Included within the active budget and occasion requirements.'
          )
        )
    );

  const nonAlcoholicCount =
    selectedRecords.filter(
      item =>
        !alcoholicPlanProduct(
          item.product
        )
    ).length;

  const availableCandidateCount =
    input.ranked.filter(
      item =>
        availableQuantity(
          item.product
        ) >
        0
    ).length;

  const softDecreaseNotes =
    decreasedConcepts.map(
      concept => {
        const availableForConcept =
          candidates.filter(
            item =>
              item.marketplace
                .matchedConcepts
                .includes(
                  concept
                )
          ).length;

        const selectedForConcept =
          selectedRecords.filter(
            item =>
              item.marketplace
                .matchedConcepts
                .includes(
                  concept
                )
          ).length;

        if (
          selectedForConcept >
          0
        ) {
          return `“Fewer ${concept}” reduced that part of the plan without excluding it; ${selectedForConcept} ${concept} selection${selectedForConcept === 1 ? '' : 's'} remain${selectedForConcept === 1 ? 's' : ''}.`;
        }

        if (
          availableForConcept >
          0
        ) {
          return `Available ${concept} products were considered, but none could remain after applying the active budget and stronger latest priorities.`;
        }

        return `No available ${concept} product could be retained from the current catalogue.`;
      }
    );

  return {
    selected,
    estimatedTotal,
    budgetLimit,
    targetBudget,
    remainingBudget:
      targetBudget
        ? Math.max(
            0,
            targetBudget -
              estimatedTotal
          )
        : null,
    excludedCount:
      Math.max(
        0,
        availableCandidateCount -
          selected.length
      ),
    nonAlcoholicCount,
    softDecreaseNotes
  };
}

function productScore(
  product:
    ProductRecord,
  signals: {
    preferredCategories:
      Set<string>;
    preferredBrands:
      Set<string>;
    recentCategories:
      Set<string>;
    wishlistProductIds:
      Set<string>;
    contextCategory:
      string |
      null;
    contextProductId:
      string |
      null;
  }
) {
  let score =
    product.rating *
      10 +
    Math.min(
      product.soldCount,
      100
    ) *
      0.12 +
    (
      product.featured
        ? 16
        : 0
    ) +
    (
      product.isNew
        ? 8
        : 0
    ) +
    (
      availableQuantity(
        product
      ) >
      0
        ? 24
        : -30
    );

  if (
    signals.preferredCategories.has(
      product.category.slug
    )
  ) {
    score +=
      28;
  }

  if (
    product.brand &&
    signals.preferredBrands.has(
      product.brand.slug
    )
  ) {
    score +=
      20;
  }

  if (
    signals.recentCategories.has(
      product.category.id
    )
  ) {
    score +=
      14;
  }

  if (
    signals.wishlistProductIds.has(
      product.id
    )
  ) {
    score +=
      8;
  }

  if (
    signals.contextCategory &&
    (
      product.category.slug ===
        signals.contextCategory ||
      product.category.id ===
        signals.contextCategory
    )
  ) {
    score +=
      32;
  }

  if (
    signals.contextProductId ===
    product.id
  ) {
    score -=
      18;
  }

  return score;
}

function isActivePlanExplanationPrompt(
  prompt:
    string
) {
  return isPlanExplanationOnlyInstruction(
    prompt
  );
}

function activePlanExplanationResponse(
  plan:
    AIAssistantResponsePayload
) {
  const budget =
    plan.metrics.find(
      metric =>
        metric.label ===
        'Budget limit'
    );

  const total =
    plan.metrics.find(
      metric =>
        metric.label ===
        'Estimated total'
    );

  const productReasons =
    plan.products.map(
      product =>
        `${product.name}: ${product.reason || 'Selected because it supports the active Journey direction.'}`
    );

  return response({
    headline:
      'Why this plan fits your Journey',
    summary:
      'This explanation reads the active plan without changing its products, budget, constraints or saved Plan version.',
    outputType:
      plan.outputType,
    confidence:
      Math.max(
        plan.confidence,
        0.84
      ),
    metrics:
      plan.metrics,
    products:
      plan.products,
    sections: [
      {
        title:
          'Why these products fit',
        bullets:
          productReasons.length
            ? productReasons
            : [
                'The active plan does not currently contain product selections to explain.'
              ]
      },
      {
        title:
          'How the plan stays aligned',
        bullets: [
          ...(budget
            ? [
                `The active budget authority remains ${budget.value}.`
              ]
            : []),
          ...(total
            ? [
                `The saved estimated total remains ${total.value}.`
              ]
            : []),
          'The active product identities, selected variants and Journey constraints were preserved exactly for this explanation.'
        ]
      },
      {
        title:
          'Marketplace authority',
        bullets: [
          'Current catalogue records remain authoritative for price, availability and variants.',
          'Opening Product Library accordions or reading this explanation does not reserve stock or perform a commerce action.'
        ]
      }
    ],
    warnings:
      plan.warnings,
    suggestedPrompts: [
      'Tell me more about the first product',
      'Show an alternative for one product',
      'Keep this plan and complete the Journey'
    ],
    actions: []
  });
}

async function customerResponse({
  access,
  prompt,
  context,
  conversation = [],
  journeyState = null,
  previousPlan = null
}: EngineInput) {
  const pendingBudgetClarification =
    hasPendingBudgetClarification(
      journeyState
    );

  const confirmedBudgetFromPrompt =
    parseNairaAmount(
      prompt,
      {
        allowBare:
          pendingBudgetClarification
      }
    );

  const journeyConversation =
    [
      ...conversation,
      prompt
    ]
      .map(
        message =>
          message
            .replace(
              /\s+/g,
              ' '
            )
            .trim()
      )
      .filter(
        Boolean
      )
      .filter(
        (
          message,
          index,
          messages
        ) =>
          index ===
            0 ||
          normalize(
            message
          ) !==
            normalize(
              messages[
                index - 1
              ] ??
              ''
            )
      );

  const journeyPrompt =
    journeyConversation.join(
      ' '
    );

  const normalizedPrompt =
    normalize(
      journeyPrompt
    );

  if (
    previousPlan &&
    isActivePlanExplanationPrompt(
      prompt
    )
  ) {
    return activePlanExplanationResponse(
      previousPlan
    );
  }

  if (
    previousPlan &&
    relativeBudgetAdjustment(
      prompt
    ) ===
      'INCREASE'
  ) {
    return relativeBudgetClarificationResponse(
      previousPlan
    );
  }

  const planConstraints =
    resolvePlanCompositionConstraints({
      state:
        journeyState,
      conversation:
        journeyConversation,
      prompt,
      confirmedBudget:
        confirmedBudgetFromPrompt
    });

  const [
    products,
    profile,
    recent,
    wishlist
  ] =
    await Promise.all([
      prisma.product.findMany({
        where: {
          workspaceId:
            access.workspaceId,
          active:
            true,
          status:
            'PUBLISHED'
        },
        include:
          productInclude,
        orderBy: [
          {
            featured:
              'desc'
          },
          {
            rating:
              'desc'
          },
          {
            soldCount:
              'desc'
          }
        ],
        take:
          100
      }),
      prisma.experienceProfile.findUnique({
        where: {
          userId:
            access.userId
        }
      }),
      prisma.recentlyViewed.findMany({
        where: {
          userId:
            access.userId,
          product: {
            workspaceId:
              access.workspaceId
          }
        },
        include: {
          product: {
            select: {
              id:
                true,
              categoryId:
                true,
              brandId:
                true
            }
          }
        },
        orderBy: {
          viewedAt:
            'desc'
        },
        take:
          20
      }),
      prisma.wishlist.findUnique({
        where: {
          workspaceId_userId: {
            workspaceId:
              access.workspaceId,
            userId:
              access.userId
          }
        },
        include: {
          items: {
            select: {
              productId:
                true
            }
          }
        }
      })
    ]);

  const personalizationEnabled =
    profile?.personalizationEnabled ??
    true;

  const signals = {
    preferredCategories:
      new Set<string>(
        personalizationEnabled
          ? profile?.preferredCategorySlugs ??
              []
          : []
      ),
    preferredBrands:
      new Set<string>(
        personalizationEnabled
          ? profile?.preferredBrandSlugs ??
              []
          : []
      ),
    recentCategories:
      new Set<string>(
        personalizationEnabled
          ? recent.map(
              item =>
                item.product.categoryId
            )
          : []
      ),
    wishlistProductIds:
      new Set<string>(
        personalizationEnabled
          ? wishlist?.items.map(
              item =>
                item.productId
            ) ??
              []
          : []
      ),
    contextCategory:
      context.category ??
      null,
    contextProductId:
      context.productId ??
      null
  };

  const marketplaceResolution =
    resolveMarketplaceRequest({
      prompt,
      journeyText:
        journeyPrompt,
      products,
      budget:
        planConstraints.budget
    });

  const marketplaceLead =
    marketplaceAcknowledgement(
      marketplaceResolution
    );

  const marketplaceSummary =
    (
      value:
        string
    ) =>
      marketplaceLead
        ? `${marketplaceLead} ${value}`
        : value;

  const ranked =
    products
      .map(
        product => {
          const marketplace =
            marketplaceProductSignal(
              marketplaceResolution,
              product.id
            );

          return {
            product,
            marketplace,
            score:
              productScore(
                product,
                signals
              ) +
              marketplace.score
          };
        }
      )
      .sort(
        (
          left,
          right
        ) =>
          right.score -
          left.score
      );

  const planLineageText =
    normalize(
      [
        journeyState?.objective ??
          '',
        ...(
          journeyState?.confirmedContext ??
          []
        ),
        ...(
          journeyState?.constraints ??
          []
        ),
        ...(
          journeyState?.preferences ??
          []
        ),
        journeyState?.latestInstruction ??
          '',
        previousPlan?.headline ??
          '',
        previousPlan?.summary ??
          '',
        ...journeyConversation
      ].join(
        ' '
      )
    );

  const inferredPlanLineageType =
    classifyCustomer(
      planLineageText
    );

  const previousPlanLineageType =
    previousPlan &&
    (
      previousPlan.outputType ===
        'PAIRING' ||
      previousPlan.outputType ===
        'SHOPPING_PLAN'
    )
      ? previousPlan.outputType
      : null;

  const inferredStructuredPlanType =
    inferredPlanLineageType ===
      'PAIRING' ||
    inferredPlanLineageType ===
      'SHOPPING_PLAN'
      ? inferredPlanLineageType
      : null;

  const hasBudgetControlledLineage =
    confirmedBudgetFromPrompt !==
      null ||
    (
      journeyState?.constraints ??
      []
    ).some(
      value =>
        /^Budget(?:\s+limit)?:/i.test(
          value
        )
    );

  const activePlanLineageType =
    previousPlanLineageType ??
    inferredStructuredPlanType ??
    (
      previousPlan?.products.length &&
      hasBudgetControlledLineage
        ? 'SHOPPING_PLAN'
        : null
    );

  const preserveActivePlanType =
    activePlanLineageType !==
      null &&
    (
      confirmedBudgetFromPrompt !==
        null ||
      pendingBudgetClarification ||
      isPlanMutationInstruction(
        prompt
      )
    );

  const outputType =
    preserveActivePlanType &&
    activePlanLineageType
      ? activePlanLineageType
      : classifyCustomer(
          normalizedPrompt
        );

  if (
    outputType ===
    'COMPARISON'
  ) {
    const directlyMentioned =
      ranked.filter(
        item => {
          const name =
            normalize(
              item.product.name
            );

          const slug =
            normalize(
              item.product.slug
            );

          return (
            normalizedPrompt.includes(
              name
            ) ||
            normalizedPrompt.includes(
              slug
            ) ||
            item.product.id ===
              context.productId ||
            item.marketplace
              .matchType ===
              'EXACT_MATCH' ||
            item.marketplace
              .matchType ===
              'ALTERNATIVE_FOUND' ||
            item.marketplace
              .score >=
              70
          );
        }
      );

    const selected =
      (
        directlyMentioned.length >=
        2
          ? directlyMentioned
          : ranked
      )
        .slice(
          0,
          3
        )
        .map(
          (
            item,
            index
          ) =>
            productCard(
              item.product,
              marketplaceReason(
                item.marketplace,
                index ===
                  0
                  ? 'Best combined availability, rating and preference match.'
                  : 'Useful alternative for price, category or style comparison.'
              )
            )
        );

    const selectedProductRecords =
      selected
        .map(
          product =>
            products.find(
              candidate =>
                candidate.id ===
                product.id
            ) ??
            null
        )
        .filter(
          (
            product
          ): product is
            ProductRecord =>
            Boolean(
              product
            )
        );

    const priceComparison =
      marketplacePriceComparison(
        selectedProductRecords
      );

    const sections:
      AIAssistantSection[] = [
      ...marketplaceResolutionSections(
        marketplaceResolution
      ),
      ...(priceComparison.length
        ? [
            {
              title:
                'Price and value',
              bullets:
                priceComparison
            }
          ]
        : []),
      {
        title:
          'Meaningful differences',
        bullets:
          selected.map(
            product =>
              `${product.name}: ${product.category}${product.brand ? ` by ${product.brand}` : ''}, ${product.available} available, rating ${product.rating.toFixed(1)}.`
          )
      },
      {
        title:
          'Decision guidance',
        bullets: [
          selected[0]
            ? `${selected[0].name} is the strongest balanced choice from the current live catalog.`
            : 'There is not enough live catalog information for a confident comparison.',
          'Confirm the preferred variant and current quantity before adding anything to Cart or a Shopping List.'
        ]
      }
    ];

    return response({
      headline:
        'Live product comparison',
      summary:
        marketplaceSummary(
          `I compared ${selected.length} available products using current price, stock, rating and your permitted personalization signals.`
        ),
      outputType,
      confidence:
        selected.length >=
        2
          ? 0.81
          : 0.58,
      products:
        selected,
      sections,
      warnings: [
        ...marketplaceResolution
          .warnings,
        ...(selected.length <
        2
          ? [
              'Only one strong product match was found. Name two products for a more precise comparison.'
            ]
          : [])
      ],
      suggestedPrompts: [
        'Compare the two cheapest available options',
        'Which one is better for a gift?',
        'Show me a similar product with more stock'
      ],
      actions: [
        {
          label:
            'Explore live Store',
          href:
            '/store',
          kind:
            'primary'
        },
        {
          label:
            'Open Wishlist',
          href:
            '/wishlist'
        }
      ]
    });
  }

  /* AJ_MS12_PAIRING_CONSTRAINT_AUTHORITY_V2 */
  if (
    outputType ===
    'PAIRING'
  ) {
    const composition =
      composeShoppingPlan({
        ranked,
        constraints:
          planConstraints,
        previousPlan,
        marketplaceResolution
      });

    const {
      selected,
      estimatedTotal,
      budgetLimit,
      targetBudget,
      remainingBudget,
      excludedCount,
      nonAlcoholicCount,
      softDecreaseNotes
    } =
      composition;

    const pairingMetrics:
      AIAssistantMetric[] = [
        {
          label:
            'Products',
          value:
            String(
              selected.length
            )
        },
        ...(planConstraints
          .nonAlcoholicMinimum >
          0
          ? [
              {
                label:
                  'Non-alcoholic options',
                value:
                  `${nonAlcoholicCount} of ${planConstraints.nonAlcoholicMinimum} minimum`,
                helper:
                  'Selected deliberately from products without alcoholic signals.',
                tone:
                  nonAlcoholicCount >=
                    planConstraints
                      .nonAlcoholicMinimum
                    ? 'positive' as const
                    : 'warning' as const
              }
            ]
          : []),
        ...(targetBudget
          ? [
              {
                label:
                  'Budget limit',
                value:
                  formatNaira(
                    targetBudget
                  ),
                helper:
                  planConstraints.reduceCost
                    ? 'Reduced-cost target applied.'
                    : 'Saved Journey budget applied.',
                tone:
                  'neutral' as const
              },
              {
                label:
                  'Estimated total',
                value:
                  formatNaira(
                    estimatedTotal
                  ),
                helper:
                  'One available variant per selected product.',
                tone:
                  estimatedTotal <=
                    targetBudget
                    ? 'positive' as const
                    : 'critical' as const
              },
              {
                label:
                  'Remaining budget',
                value:
                  formatNaira(
                    remainingBudget ??
                      0
                  ),
                tone:
                  'positive' as const
              }
            ]
          : [
              {
                label:
                  'Estimated total',
                value:
                  formatNaira(
                    estimatedTotal
                  ),
                helper:
                  planConstraints.flexibleBudget
                    ? 'Flexible budget direction applied.'
                    : 'No fixed Journey budget was available.',
                tone:
                  'neutral' as const
              }
            ]),
        {
          label:
            'Products excluded',
          value:
            String(
              excludedCount
            ),
          helper:
            'Unavailable, over-budget or weak occasion matches were not included.',
          tone:
            excludedCount >
              0
              ? 'positive'
              : 'neutral'
        }
      ];

    return response({
      headline:
        'Budget-controlled occasion pairing',
      summary:
        marketplaceSummary(
          targetBudget
            ? `An occasion pairing estimated at ${formatNaira(
                estimatedTotal
              )} within the active ${formatNaira(
                targetBudget
              )} target. Products that conflicted with the budget, occasion or latest direction were excluded.`
            : `An occasion pairing estimated at ${formatNaira(
                estimatedTotal
              )}, composed from available products using the saved Journey context.`
        ),
      outputType,
      confidence:
        selected.length >=
          3
          ? 0.86
          : selected.length >
              0
            ? 0.68
            : 0.42,
      metrics:
        pairingMetrics,
      products:
        selected,
      sections: [
        ...marketplaceResolutionSections(
          marketplaceResolution
        ),
        {
          title:
            'Serving flow',
          bullets:
            selected.length >
              0
              ? selected
                  .slice(
                    0,
                    4
                  )
                  .map(
                    (
                      product,
                      index
                    ) =>
                      index ===
                        0
                        ? `Begin with ${product.name} as the anchor selection for the occasion.`
                        : `Use ${product.name} as a complementary option within the current budget.`
                  )
              : [
                  'No available combination currently satisfies all active constraints.'
                ]
        },
        {
          title:
            'Constraint reasoning',
          bullets: [
            ...(budgetLimit
              ? [
                  `The saved Journey budget is ${formatNaira(
                    budgetLimit
                  )}.`
                ]
              : [
                  'The Journey currently allows a flexible budget.'
                ]),
            ...(planConstraints.guestCount
              ? [
                  `The pairing is being prepared for ${planConstraints.guestCount} people.`
                ]
              : []),
            ...(planConstraints.preference ===
              'AFFORDABLE'
              ? [
                  'Affordable direction restricted individual product prices and the combined basket total.'
                ]
              : []),
            ...(planConstraints.reduceCost
              ? [
                  'Premium and high-cost products were restricted by the latest refinement.'
                ]
              : []),
            ...(planConstraints
              .nonAlcoholicMinimum >
              0
              ? [
                  `${nonAlcoholicCount} non-alcoholic option${nonAlcoholicCount === 1 ? '' : 's'} were selected against the requested minimum of ${planConstraints.nonAlcoholicMinimum}.`
                ]
              : []),
            ...softDecreaseNotes,
            `${excludedCount} available catalogue products were excluded by active constraints or weak occasion relevance.`
          ]
        },
        {
          title:
            'Before checkout',
          bullets: [
            'Confirm preferred quantities before creating a Shopping List.',
            'Current prices and availability remain authoritative at the time of preparation.',
            'This pairing does not reserve stock automatically.'
          ]
        }
      ],
      warnings: [
        ...marketplaceResolution
          .warnings,
        ...(selected.length ===
          0
          ? [
              'No available product combination could satisfy the active pairing constraints. Adjust the budget or preference before continuing.'
            ]
          : []),
        ...(planConstraints
          .nonAlcoholicMinimum >
            0 &&
          nonAlcoholicCount <
            planConstraints
              .nonAlcoholicMinimum
          ? [
              `Only ${nonAlcoholicCount} non-alcoholic option${nonAlcoholicCount === 1 ? '' : 's'} could be composed within the active catalogue and budget.`
            ]
          : []),
        'This draft does not reserve inventory or create a Shopping List automatically.'
      ],
      suggestedPrompts: [
        'Reduce cost further',
        'Show a different combination within the same budget',
        'Turn this into a party Shopping List'
      ],
      actions:
        selected.length >
        0
          ? [
              {
                label:
                  'Open Shopping Lists',
                href:
                  '/account/lists',
                kind:
                  'primary'
              },
              {
                label:
                  'Browse Store',
                href:
                  '/store'
              }
            ]
          : []
    });
  }

  if (
    outputType ===
    'SHOPPING_PLAN'
  ) {
    const composition =
      composeShoppingPlan({
        ranked,
        constraints:
          planConstraints,
        previousPlan,
        marketplaceResolution
      });

    const {
      selected,
      estimatedTotal,
      budgetLimit,
      targetBudget,
      remainingBudget,
      excludedCount,
      nonAlcoholicCount,
      softDecreaseNotes
    } =
      composition;

    const budgetMetrics:
      AIAssistantMetric[] = [
        ...(planConstraints
          .nonAlcoholicMinimum >
          0
          ? [
              {
                label:
                  'Non-alcoholic options',
                value:
                  `${nonAlcoholicCount} of ${planConstraints.nonAlcoholicMinimum} minimum`,
                helper:
                  'Selected deliberately from products without alcoholic signals.',
                tone:
                  nonAlcoholicCount >=
                    planConstraints
                      .nonAlcoholicMinimum
                    ? 'positive' as const
                    : 'warning' as const
              }
            ]
          : []),
        ...(targetBudget
          ? [
              {
                label:
                  'Budget limit',
                value:
                  formatNaira(
                    targetBudget
                  ),
                helper:
                  planConstraints.reduceCost
                    ? 'Reduced-cost target applied.'
                    : 'Saved Journey budget applied.',
                tone:
                  'neutral' as const
              },
              {
                label:
                  'Estimated total',
                value:
                  formatNaira(
                    estimatedTotal
                  ),
                helper:
                  'Based on one available variant of each selected product.',
                tone:
                  estimatedTotal <=
                    targetBudget
                    ? 'positive' as const
                    : 'critical' as const
              },
              {
                label:
                  'Remaining budget',
                value:
                  formatNaira(
                    remainingBudget ??
                      0
                  ),
                tone:
                  'positive' as const
              }
            ]
          : [
              {
                label:
                  'Estimated total',
                value:
                  formatNaira(
                    estimatedTotal
                  ),
                helper:
                  planConstraints.flexibleBudget
                    ? 'Flexible budget direction applied.'
                    : 'No fixed Journey budget was available.',
                tone:
                  'neutral' as const
              }
            ]),
        {
          label:
            'Products excluded',
          value:
            String(
              excludedCount
            ),
          helper:
            'Unavailable, over-budget or weak occasion matches were not included.',
          tone:
            excludedCount >
              0
              ? 'positive'
              : 'neutral'
        }
      ];

    return response({
      headline:
        'Budget-controlled Shopping plan',
      summary:
        marketplaceSummary(
          targetBudget
            ? `A live-catalog plan estimated at ${formatNaira(
                estimatedTotal
              )} within the active ${formatNaira(
                targetBudget
              )} target. Products that conflicted with the budget, occasion or latest refinement were excluded.`
            : `A live-catalog plan estimated at ${formatNaira(
                estimatedTotal
              )}, composed around the saved occasion and preference signals.`
        ),
      outputType,
      confidence:
        selected.length >=
          3
          ? 0.86
          : selected.length >
              0
            ? 0.68
            : 0.42,
      metrics:
        budgetMetrics,
      products:
        selected,
      sections: [
        ...marketplaceResolutionSections(
          marketplaceResolution
        ),
        {
          title:
            'Core plan',
          bullets:
            selected
              .slice(
                0,
                4
              )
              .map(
                product =>
                  `Start with 1 × ${product.name} at ${product.price ? formatNaira(
                    product.price
                  ) : 'the current available price'}.`
              )
        },
        {
          title:
            'Optional additions',
          bullets:
            selected
              .slice(
                4
              )
              .map(
                product =>
                  `${product.name} remains within the current composition as an optional supporting item.`
              )
        },
        {
          title:
            'Constraint reasoning',
          bullets: [
            ...(budgetLimit
              ? [
                  `The saved Journey budget is ${formatNaira(
                    budgetLimit
                  )}.`
                ]
              : [
                  'The Journey currently allows a flexible budget.'
                ]),
            ...(planConstraints.guestCount
              ? [
                  `The composition is being prepared for ${planConstraints.guestCount} people.`
                ]
              : []),
            ...(planConstraints.reduceCost
              ? [
                  'Premium and high-cost products were restricted by the latest refinement.'
                ]
              : []),
            ...(planConstraints
              .nonAlcoholicMinimum >
              0
              ? [
                  `${nonAlcoholicCount} non-alcoholic option${nonAlcoholicCount === 1 ? '' : 's'} were selected against the requested minimum of ${planConstraints.nonAlcoholicMinimum}.`
                ]
              : []),
            ...softDecreaseNotes,
            `${excludedCount} available catalogue products were excluded by active constraints or weak occasion relevance.`
          ]
        }
      ],
      warnings: [
        ...marketplaceResolution
          .warnings,
        ...(selected.length ===
          0
          ? [
              'No available product combination could satisfy the active constraints. Adjust the budget or preference before creating a Shopping List.'
            ]
          : []),
        ...(planConstraints
          .nonAlcoholicMinimum >
            0 &&
          nonAlcoholicCount <
            planConstraints
              .nonAlcoholicMinimum
          ? [
              `Only ${nonAlcoholicCount} non-alcoholic option${nonAlcoholicCount === 1 ? '' : 's'} could be composed within the active catalogue and budget.`
            ]
          : []),
        'This draft does not reserve inventory or create a Shopping List automatically.'
      ],
      suggestedPrompts: [
        'Reduce cost further',
        'Show a different combination within the same budget',
        'Explain why each product fits this occasion'
      ],
      actions:
        selected.length >
        0
          ? [
              {
                label:
                  'Create Shopping List',
                href:
                  '/account/lists',
                kind:
                  'primary'
              }
            ]
          : []
    });
  }

  const recommendations =
    ranked
      .filter(
        item =>
          availableQuantity(
            item.product
          ) >
          0
      )
      .slice(
        0,
        8
      )
      .map(
        (
          item,
          index
        ) =>
          productCard(
            item.product,
            marketplaceReason(
              item.marketplace,
              index ===
                0
                ? 'Strongest live match across availability, rating and current context.'
                : personalizationEnabled
                  ? 'Matches your permitted browsing, Wishlist or preference signals.'
                  : 'Selected from live catalog quality and availability.'
            )
          )
      );

  return response({
    headline:
      'Smart picks from the live Store',
    summary:
      marketplaceSummary(
        personalizationEnabled
          ? 'These suggestions combine live availability with your permitted customer experience signals.'
          : 'Personalization is disabled, so these suggestions use only live catalog quality and availability.'
      ),
    outputType,
    confidence:
      recommendations.length >=
      5
        ? 0.82
        : 0.63,
    metrics: [
      {
        label:
          'Live matches',
        value:
          String(
            recommendations.length
          )
      },
      {
        label:
          'Personalization',
        value:
          personalizationEnabled
            ? 'Enabled'
            : 'Disabled'
      },
      {
        label:
          'In-stock picks',
        value:
          String(
            recommendations.filter(
              product =>
                product.available >
                0
            ).length
          ),
        tone:
          'positive'
      }
    ],
    products:
      recommendations,
    sections: [
      ...marketplaceResolutionSections(
        marketplaceResolution
      ),
      {
        title:
          'Why these appeared',
        bullets: [
          context.category
            ? `Current category context: ${context.category}.`
            : 'No category was forced, so the engine considered the wider live catalog.',
          personalizationEnabled
            ? 'Recent views, preferred categories, preferred brands and Wishlist signals were considered.'
            : 'Private customer activity was not used.',
          'Unavailable products were removed from the leading recommendations.'
        ]
      }
    ],
    warnings:
      marketplaceResolution
        .warnings,
    suggestedPrompts: [
      'Compare the top three products',
      'Build a dinner pairing from these picks',
      'Create a lower-cost Shopping List'
    ],
    actions: [
      {
        label:
          'Explore Store',
        href:
          '/store',
        kind:
          'primary'
      },
      {
        label:
          'Open Wishlist',
        href:
          '/wishlist'
      }
    ]
  });
}

async function adminResponse({
  access,
  prompt
}: EngineInput) {
  const normalizedPrompt =
    normalize(
      prompt
    );

  if (
    isProductCreationPrompt(
      normalizedPrompt
    )
  ) {
    return productCreationResponse({
      access,
      prompt,
      context: {
        workspaceId:
          access.workspaceId,
        vendorProfileId:
          access.vendorProfileId
      }
    });
  }

  const outputType =
    classifyAdmin(
      normalizedPrompt
    );

  const since =
    new Date(
      Date.now() -
      30 *
        24 *
        60 *
        60 *
        1000
    );

  const [
    products,
    approvalCount,
    activeTodos,
    failedDeliveries,
    recentEvents
  ] =
    await Promise.all([
      prisma.product.findMany({
        where: {
          workspaceId:
            access.workspaceId,
          status: {
            not:
              'ARCHIVED'
          }
        },
        include:
          productInclude,
        orderBy: {
          updatedAt:
            'desc'
        },
        take:
          120
      }),
      prisma.adminApprovalRequest.count({
        where: {
          workspaceId:
            access.workspaceId,
          status: {
            in: [
              'PENDING',
              'IN_INSPECTION',
              'ON_HOLD',
              'CHANGES_REQUESTED'
            ]
          }
        }
      }),
      prisma.adminTodo.findMany({
        where: {
          workspaceId:
            access.workspaceId,
          status: {
            in: [
              'OPEN',
              'IN_PROGRESS',
              'BLOCKED'
            ]
          }
        },
        orderBy: [
          {
            priority:
              'desc'
          },
          {
            dueAt:
              'asc'
          }
        ],
        take:
          20
      }),
      prisma.delivery.count({
        where: {
          workspaceId:
            access.workspaceId,
          status:
            'FAILED'
        }
      }),
      prisma.experienceEvent.findMany({
        where: {
          workspaceId:
            access.workspaceId,
          createdAt: {
            gte:
              since
          }
        },
        select: {
          type:
            true,
          productId:
            true
        },
        take:
          5000
      })
    ]);

  const productsWithIssues =
    products
      .map(
        product => ({
          product,
          issues:
            qualityIssues(
              product
            )
        })
      )
      .filter(
        item =>
          item.issues.length >
          0
      )
      .sort(
        (
          left,
          right
        ) =>
          right.issues.length -
          left.issues.length
      );

  const lowStock =
    products.flatMap(
      product =>
        product.variants
          .filter(
            variant => {
              if (
                !variant.inventory
              ) {
                return false;
              }

              const available =
                variant.inventory
                  .quantity -
                variant.inventory
                  .reserved;

              return (
                available <=
                variant.inventory
                  .reorderLevel
              );
            }
          )
          .map(
            variant => ({
              product,
              variant,
              available:
                (
                  variant.inventory
                    ?.quantity ??
                  0
                ) -
                (
                  variant.inventory
                    ?.reserved ??
                  0
                )
            })
          )
    );

  const productViews =
    recentEvents.filter(
      event =>
        event.type ===
        'PRODUCT_VIEW'
    ).length;

  if (
    outputType ===
    'CATALOG_DRAFT'
  ) {
    const selected =
      productsWithIssues
        .slice(
          0,
          8
        )
        .map(
          item =>
            productCard(
              item.product,
              `Needs ${item.issues.join(', ')}.`
            )
        );

    return response({
      headline:
        'Catalog quality draft',
      summary:
        `${productsWithIssues.length} product records have at least one quality gap. The list below starts with the most incomplete records.`,
      outputType,
      confidence:
        0.9,
      metrics: [
        {
          label:
            'Products checked',
          value:
            String(
              products.length
            )
        },
        {
          label:
            'Needs attention',
          value:
            String(
              productsWithIssues.length
            ),
          tone:
            productsWithIssues.length
              ? 'warning'
              : 'positive'
        },
        {
          label:
            'Low-stock variants',
          value:
            String(
              lowStock.length
            ),
          tone:
            lowStock.length
              ? 'warning'
              : 'positive'
        }
      ],
      products:
        selected,
      sections: [
        {
          title:
            'Highest-impact fixes',
          bullets:
            productsWithIssues
              .slice(
                0,
                6
              )
              .map(
                item =>
                  `${item.product.name}: add or improve ${item.issues.join(', ')}.`
              )
        },
        {
          title:
            'Governed application',
          bullets: [
            'Use this response as a draft; no Product record has been edited.',
            'Price, stock, status and public presentation remain under existing Product Studio and approval authorities.'
          ]
        }
      ],
      suggestedPrompts: [
        'Draft descriptions for the most incomplete products',
        'Find products missing media',
        'Prepare a catalog-quality Todo list'
      ],
      actions: [
        {
          label:
            'Open Product Studio',
          href:
            '/admin/products',
          kind:
            'primary'
        },
        {
          label:
            'Open Inventory',
          href:
            '/admin/inventory'
        }
      ]
    });
  }

  if (
    outputType ===
    'CAMPAIGN_DRAFT'
  ) {
    const candidates =
      products
        .filter(
          product =>
            product.status ===
              'PUBLISHED' &&
            product.active &&
            availableQuantity(
              product
            ) >
              0
        )
        .sort(
          (
            left,
            right
          ) =>
            (
              right.rating *
                10 +
              right.soldCount
            ) -
            (
              left.rating *
                10 +
              left.soldCount
            )
        )
        .slice(
          0,
          6
        );

    const campaignProducts =
      candidates.map(
        product =>
          productCard(
            product,
            'Strong published candidate based on availability, rating and sales signal.'
          )
      );

    const campaignTitle =
      contextTitleFromProducts(
        candidates,
        'Shelsea Live Picks'
      );

    return response({
      headline:
        'Store campaign draft',
      summary:
        'A reviewable merchandising concept assembled from currently published and available products.',
      outputType,
      confidence:
        campaignProducts.length >=
        4
          ? 0.82
          : 0.64,
      products:
        campaignProducts,
      draftFields: [
        {
          label:
            'Campaign title',
          value:
            campaignTitle
        },
        {
          label:
            'Eyebrow',
          value:
            'Live Store intelligence'
        },
        {
          label:
            'Description',
          value:
            'A focused discovery campaign built from well-rated products with current availability.'
        },
        {
          label:
            'Recommended layout',
          value:
            campaignProducts.length >=
            5
              ? 'Featured hero with carousel destination'
              : 'Compact spotlight grid'
        }
      ],
      sections: [
        {
          title:
            'Execution checklist',
          bullets: [
            'Confirm media quality and mobile crops.',
            'Check price and stock immediately before scheduling.',
            'Review vendor ownership and approval requirements for each selected product.',
            'Publish only through Store Studio after authorised review.'
          ]
        }
      ],
      suggestedPrompts: [
        'Create a lower-cost campaign',
        'Build a weekend Collection from these products',
        'Draft Story and Reel copy for this campaign'
      ],
      actions: [
        {
          label:
            'Open Store Studio',
          href:
            '/admin/store-studio',
          kind:
            'primary'
        },
        {
          label:
            'Review Approvals',
          href:
            '/admin/approvals'
        }
      ]
    });
  }

  if (
    outputType ===
    'GOVERNANCE_EXPLANATION'
  ) {
    return response({
      headline:
        'Workspace governance explanation',
      summary:
        'AJ Intelligence can prepare drafts and explain likely impact, but existing server actions, permissions, approvals and audit events remain authoritative.',
      outputType,
      confidence:
        0.97,
      metrics: [
        {
          label:
            'Open approvals',
          value:
            String(
              approvalCount
            )
        },
        {
          label:
            'Active Todos',
          value:
            String(
              activeTodos.length
            )
        }
      ],
      sections: [
        {
          title:
            'Assistant boundary',
          bullets: [
            'The assistant cannot approve its own recommendations.',
            'The assistant does not publish, delete, change price or alter inventory autonomously.',
            'Every accepted operation must continue through the operator’s permission and approval boundary.',
            'Vendor and customer-private data remain scoped to their authorised contexts.'
          ]
        },
        {
          title:
            'Current review attention',
          bullets: [
            `${approvalCount} approval requests are currently active.`,
            `${activeTodos.length} operational Todos are active in this workspace.`,
            `${failedDeliveries} Delivery records currently require failure resolution.`
          ]
        }
      ],
      suggestedPrompts: [
        'Summarise pending approvals',
        'Explain today’s highest-risk Todos',
        'Prepare an approval-ready campaign draft'
      ],
      actions: [
        {
          label:
            'Open Approval Studio',
          href:
            '/admin/approvals',
          kind:
            'primary'
        },
        {
          label:
            'Open Todo Studio',
          href:
            '/admin/todos'
        }
      ]
    });
  }

  const urgentTodos =
    activeTodos.filter(
      todo =>
        todo.priority ===
        'URGENT' ||
        todo.priority ===
        'HIGH'
    );

  return response({
    headline:
      'Workspace operations brief',
    summary:
      'A live operational summary grounded in approvals, Todos, Delivery exceptions, catalog quality and recent customer activity.',
    outputType:
      'OPERATIONS_BRIEF',
    confidence:
      0.91,
    metrics: [
      {
        label:
          'Open approvals',
        value:
          String(
            approvalCount
          ),
        tone:
          approvalCount
            ? 'warning'
            : 'positive'
      },
      {
        label:
          'Active Todos',
        value:
          String(
            activeTodos.length
          )
      },
      {
        label:
          'High/Urgent',
        value:
          String(
            urgentTodos.length
          ),
        tone:
          urgentTodos.length
            ? 'critical'
            : 'positive'
      },
      {
        label:
          'Failed Delivery',
        value:
          String(
            failedDeliveries
          ),
        tone:
          failedDeliveries
            ? 'critical'
            : 'positive'
      },
      {
        label:
          'Catalog gaps',
        value:
          String(
            productsWithIssues.length
          ),
        tone:
          productsWithIssues.length
            ? 'warning'
            : 'positive'
      },
      {
        label:
          '30-day views',
        value:
          String(
            productViews
          )
      }
    ],
    sections: [
      {
        title:
          'Priority now',
        bullets:
          urgentTodos.length
            ? urgentTodos
                .slice(
                  0,
                  6
                )
                .map(
                  todo =>
                    `${todo.priority}: ${todo.title}${todo.dueAt ? ` · due ${todo.dueAt.toLocaleString('en-NG')}` : ''}`
                )
            : [
                'No High or Urgent Todo currently requires immediate escalation.'
              ]
      },
      {
        title:
          'Commerce attention',
        bullets: [
          `${lowStock.length} variants are at or below their reorder level.`,
          `${productsWithIssues.length} product records have listing-quality gaps.`,
          `${approvalCount} requests are waiting somewhere in the approval lifecycle.`
        ]
      }
    ],
    suggestedPrompts: [
      'Show the catalog records with the most missing information',
      'Draft a campaign from currently available products',
      'Explain the approval and Todo risks'
    ],
    actions: [
      {
        label:
          'Open Todo Studio',
        href:
          '/admin/todos',
        kind:
          'primary'
      },
      {
        label:
          'Open Approvals',
        href:
          '/admin/approvals'
      },
      {
        label:
          'Open Deliveries',
        href:
          '/admin/deliveries'
      }
    ]
  });
}

function contextTitleFromProducts(
  products:
    ProductRecord[],
  fallback:
    string
) {
  const categoryCounts =
    new Map<
      string,
      number
    >();

  for (
    const product of
    products
  ) {
    categoryCounts.set(
      product.category.label,
      (
        categoryCounts.get(
          product.category.label
        ) ??
        0
      ) +
        1
    );
  }

  const leading =
    [
      ...categoryCounts.entries()
    ].sort(
      (
        left,
        right
      ) =>
        right[1] -
        left[1]
    )[0]?.[0];

  return leading
    ? `${leading} Discovery Edit`
    : fallback;
}

async function vendorResponse({
  access,
  prompt
}: EngineInput) {
  if (
    !access.vendorProfileId
  ) {
    throw new Error(
      'Vendor context is required.'
    );
  }

  const normalizedPrompt =
    normalize(
      prompt
    );

  if (
    isProductCreationPrompt(
      normalizedPrompt
    )
  ) {
    return productCreationResponse({
      access,
      prompt,
      context: {
        workspaceId:
          access.workspaceId,
        vendorProfileId:
          access.vendorProfileId
      }
    });
  }

  const outputType =
    classifyVendor(
      normalizedPrompt
    );

  const since =
    new Date(
      Date.now() -
      30 *
        24 *
        60 *
        60 *
        1000
    );

  const [
    products,
    campaignCount,
    collectionCount,
    promotionCount,
    approvalCount
  ] =
    await Promise.all([
      prisma.product.findMany({
        where: {
          workspaceId:
            access.workspaceId,
          vendorProfileId:
            access.vendorProfileId,
          status: {
            not:
              'ARCHIVED'
          }
        },
        include:
          productInclude,
        orderBy: {
          updatedAt:
            'desc'
        },
        take:
          120
      }),
      prisma.storeStudioCampaign.count({
        where: {
          workspaceId:
            access.workspaceId,
          vendorProfileId:
            access.vendorProfileId,
          status: {
            not:
              'EXPIRED'
          }
        }
      }),
      prisma.storeCollection.count({
        where: {
          workspaceId:
            access.workspaceId,
          vendorProfileId:
            access.vendorProfileId,
          status: {
            not:
              'ARCHIVED'
          }
        }
      }),
      prisma.promotion.count({
        where: {
          workspaceId:
            access.workspaceId,
          vendorProfileId:
            access.vendorProfileId,
          status: {
            not:
              'ARCHIVED'
          }
        }
      }),
      prisma.adminApprovalRequest.count({
        where: {
          workspaceId:
            access.workspaceId,
          requestedById:
            access.userId,
          status: {
            in: [
              'PENDING',
              'IN_INSPECTION',
              'ON_HOLD',
              'CHANGES_REQUESTED'
            ]
          }
        }
      })
    ]);

  const productIds =
    products.map(
      product =>
        product.id
    );

  const events =
    productIds.length
      ? await prisma.experienceEvent.findMany({
          where: {
            workspaceId:
              access.workspaceId,
            createdAt: {
              gte:
                since
            },
            productId: {
              in:
                productIds
            }
          },
          select: {
            productId:
              true,
            type:
              true
          },
          take:
            5000
        })
      : [];

  const viewCounts =
    new Map<
      string,
      number
    >();

  for (
    const event of
    events
  ) {
    if (
      event.type !==
        'PRODUCT_VIEW' ||
      !event.productId
    ) {
      continue;
    }

    viewCounts.set(
      event.productId,
      (
        viewCounts.get(
          event.productId
        ) ??
        0
      ) +
        1
    );
  }

  const quality =
    products
      .map(
        product => ({
          product,
          issues:
            qualityIssues(
              product
            ),
          views:
            viewCounts.get(
              product.id
            ) ??
            0
        })
      )
      .sort(
        (
          left,
          right
        ) =>
          (
            right.issues
              .length *
              10 +
            right.views
          ) -
          (
            left.issues
              .length *
              10 +
            left.views
          )
      );

  if (
    outputType ===
    'CAMPAIGN_DRAFT'
  ) {
    const candidates =
      quality
        .filter(
          item =>
            item.product.status ===
              'PUBLISHED' &&
            item.product.active &&
            availableQuantity(
              item.product
            ) >
              0
        )
        .sort(
          (
            left,
            right
          ) =>
            (
              right.views +
              right.product
                .rating *
                10 +
              right.product
                .soldCount
            ) -
            (
              left.views +
              left.product
                .rating *
                10 +
              left.product
                .soldCount
            )
        )
        .slice(
          0,
          6
        );

    const selected =
      candidates.map(
        item =>
          productCard(
            item.product,
            `${item.views} recent product views with live published availability.`
          )
      );

    return response({
      headline:
        'Vendor campaign draft',
      summary:
        'A draft built only from this vendor’s published products and workspace-scoped activity.',
      outputType,
      confidence:
        selected.length >=
        4
          ? 0.84
          : 0.64,
      metrics: [
        {
          label:
            'Campaign records',
          value:
            String(
              campaignCount
            )
        },
        {
          label:
            'Collections',
          value:
            String(
              collectionCount
            )
        },
        {
          label:
            'Promotions',
          value:
            String(
              promotionCount
            )
        },
        {
          label:
            'Open approvals',
          value:
            String(
              approvalCount
            ),
          tone:
            approvalCount
              ? 'warning'
              : 'positive'
        }
      ],
      products:
        selected,
      draftFields: [
        {
          label:
            'Campaign title',
          value:
            contextTitleFromProducts(
              candidates.map(
                item =>
                  item.product
              ),
              'Vendor Live Selection'
            )
        },
        {
          label:
            'Description',
          value:
            'A focused presentation of available products currently attracting customer interest.'
        },
        {
          label:
            'Suggested format',
          value:
            selected.length >=
            4
              ? 'Story sequence with Reel companion'
              : 'Compact Collection spotlight'
        },
        {
          label:
            'Submission state',
          value:
            'Draft only · Workspace approval required'
        }
      ],
      sections: [
        {
          title:
            'Submission checklist',
          bullets: [
            'Confirm that every selected product is still published and available.',
            'Use only vendor-owned media assets.',
            'Review mobile crops and action destinations.',
            'Submit through the existing Vendor Studio approval boundary.'
          ]
        }
      ],
      suggestedPrompts: [
        'Draft Story copy for this selection',
        'Create a promotion bundle from the same products',
        'Check the campaign for approval blockers'
      ],
      actions: [
        {
          label:
            'Open Stories',
          href:
            '/vendor/stories',
          kind:
            'primary'
        },
        {
          label:
            'Open Reels',
          href:
            '/vendor/reels'
        },
        {
          label:
            'Review Submissions',
          href:
            '/vendor/submissions'
        }
      ]
    });
  }

  if (
    outputType ===
    'GOVERNANCE_EXPLANATION'
  ) {
    const blocked =
      quality.filter(
        item =>
          item.issues.length >
          0
      );

    return response({
      headline:
        'Vendor submission readiness',
      summary:
        'Readiness is evaluated only against this vendor’s records. Workspace approval remains authoritative.',
      outputType,
      confidence:
        0.9,
      metrics: [
        {
          label:
            'Products',
          value:
            String(
              products.length
            )
        },
        {
          label:
            'Listing gaps',
          value:
            String(
              blocked.length
            ),
          tone:
            blocked.length
              ? 'warning'
              : 'positive'
        },
        {
          label:
            'Open approvals',
          value:
            String(
              approvalCount
            ),
          tone:
            approvalCount
              ? 'warning'
              : 'positive'
        }
      ],
      sections: [
        {
          title:
            'Likely blockers',
          bullets:
            blocked.length
              ? blocked
                  .slice(
                    0,
                    8
                  )
                  .map(
                    item =>
                      `${item.product.name}: ${item.issues.join(', ')}.`
                  )
              : [
                  'No common listing-quality blocker was found in the current vendor catalog.'
                ]
        },
        {
          title:
            'Authority boundary',
          bullets: [
            'AI drafts cannot publish or submit themselves.',
            'Vendor ownership remains enforced for Products, media, Collections, promotions and campaigns.',
            'Controlled public changes continue through workspace approval.',
            'Another vendor’s data is never included in this analysis.'
          ]
        }
      ],
      suggestedPrompts: [
        'Show the products with the most listing gaps',
        'Draft cleaner descriptions for incomplete products',
        'Prepare a campaign that is ready for approval'
      ],
      actions: [
        {
          label:
            'Open Product Studio',
          href:
            '/vendor/products',
          kind:
            'primary'
        },
        {
          label:
            'Review Submissions',
          href:
            '/vendor/submissions'
        }
      ]
    });
  }

  const issueProducts =
    quality
      .filter(
        item =>
          item.issues.length >
          0
      )
      .slice(
        0,
        8
      );

  return response({
    headline:
      'Vendor listing quality draft',
    summary:
      `${issueProducts.length} leading records are shown with the most important improvements first.`,
    outputType:
      'CATALOG_DRAFT',
    confidence:
      0.88,
    metrics: [
      {
        label:
          'Products checked',
        value:
          String(
            products.length
          )
      },
      {
        label:
          'Needs attention',
        value:
          String(
            quality.filter(
              item =>
                item.issues.length >
                0
            ).length
          ),
        tone:
          issueProducts.length
            ? 'warning'
            : 'positive'
      },
      {
        label:
          '30-day views',
        value:
          String(
            events.filter(
              event =>
                event.type ===
                'PRODUCT_VIEW'
            ).length
          )
      },
      {
        label:
          'Open approvals',
        value:
          String(
            approvalCount
          )
      }
    ],
    products:
      issueProducts.map(
        item =>
          productCard(
            item.product,
            `Improve ${item.issues.join(', ')}.`
          )
      ),
    sections: [
      {
        title:
          'Recommended editing order',
        bullets:
          issueProducts.length
            ? issueProducts.map(
                item =>
                  `${item.product.name}: ${item.issues.join(', ')}.`
              )
            : [
                'The current vendor catalog has no common structural listing gap.'
              ]
      },
      {
        title:
          'Draft-only reminder',
        bullets: [
          'No Product field has been edited.',
          'Review titles, descriptions, tags, variants and media inside Product Studio.',
          'Submit controlled changes through the existing approval flow.'
        ]
      }
    ],
    suggestedPrompts: [
      'Draft a better description for the first product',
      'Prepare a submission checklist',
      'Build a campaign from the strongest available products'
    ],
    actions: [
      {
        label:
          'Open Product Studio',
        href:
          '/vendor/products',
        kind:
          'primary'
      },
      {
        label:
          'Open Media Studio',
        href:
          '/vendor/media'
      }
    ]
  });
}

export async function runLocalAssistant(
  input:
    EngineInput
): Promise<AIAssistantResponsePayload> {
  const collaborativeResponse =
    resolveCollaborativeIntentResponse({
      audience:
        input.access.audience,
      prompt:
        input.prompt,
      conversation:
        input.conversation ?? []
    });

  if (collaborativeResponse) {
    return collaborativeResponse;
  }

  if (
    input.access.audience ===
    'customer'
  ) {
    return customerResponse(
      input
    );
  }

  if (
    input.access.audience ===
    'admin'
  ) {
    return adminResponse(
      input
    );
  }

  return vendorResponse(
    input
  );
}

export function assistantSessionTitle(
  prompt:
    string
) {
  return promptTitle(
    prompt
  );
}
