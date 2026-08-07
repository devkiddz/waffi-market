import type {
  AIAssistantAudience,
  AIAssistantProfile
} from './contracts';

const profiles: Record<
  AIAssistantAudience,
  AIAssistantProfile
> = {
  admin: {
    audience:
      'admin',
    eyebrow:
      'Shelsea · Admin Assistant',
    title:
      'Admin Assistant',
    description:
      'Clear, practical help for product creation, store planning and the work that needs attention first.',
    contextDescription:
      'I use your permitted store records, products, inventory, approvals and operations to prepare clear suggestions for you to review.',
    capabilities: [
      {
        id:
          'admin-products',
        title:
          'Create and improve Products',
        description:
          'Recognise a Product from your request, match its existing category and brand, create an inactive draft, or prepare improvements for an existing listing.',
        examples: [
          'Create a new Product called Moët Nectar Impérial under Wines',
          'Draft a stronger Product description',
          'Find Products missing media or variants'
        ]
      },
      {
        id:
          'admin-store',
        title:
          'Plan the Store',
        description:
          'Prepare Collections, Promotions, Stories, Reels and banners from current commerce signals.',
        examples: [
          'Draft a weekend campaign',
          'Suggest Products for a Collection',
          'Prepare Story and Reel copy'
        ]
      },
      {
        id:
          'admin-operations',
        title:
          'Prioritise operations',
        description:
          'Summarise approvals, low stock, delayed deliveries and the most important work to do next.',
        examples: [
          'Prioritise today’s management queue',
          'Explain this stock warning',
          'Summarise pending approvals'
        ]
      },
      {
        id:
          'admin-workflow',
        title:
          'Prepare the next step',
        description:
          'Turn a reviewed response into a Product draft, Admin Todo, revision request or campaign draft.',
        examples: [
          'Create an Admin Todo from this',
          'Submit this Product improvement for review',
          'Create an unpublished campaign draft'
        ]
      }
    ],
    authorityRules: [
      'You review every suggestion before Shelsea creates anything.',
      'Product drafts are inactive and cannot appear in the Store until Product Studio is completed and the normal publication process succeeds.',
      'Shelsea cannot approve its own work, publish content, change prices or alter stock automatically.',
      'Every accepted action stays within the store and permissions you are currently using.'
    ],
    preparationSteps: [
      'Check the current store and your permissions',
      'Match live catalog and operational records',
      'Prepare a clear suggestion or draft',
      'Wait for your review and confirmation',
      'Record the resulting action and destination'
    ]
  },
  vendor: {
    audience:
      'vendor',
    eyebrow:
      'Shelsea · Vendor Assistant',
    title:
      'Vendor Assistant',
    description:
      'Practical help for creating products, improving listings, preparing campaigns and getting submissions ready.',
    contextDescription:
      'I use only the products, media, campaigns and submissions available to your current vendor account.',
    capabilities: [
      {
        id:
          'vendor-products',
        title:
          'Create and improve Products',
        description:
          'Recognise a new Product, prepare an inactive vendor-owned draft, improve listing copy and identify missing details.',
        examples: [
          'Create a new Product called Celebration Chocolate Box under Confectionery',
          'Improve this Product listing',
          'Prepare a submission checklist'
        ]
      },
      {
        id:
          'vendor-campaigns',
        title:
          'Prepare campaigns',
        description:
          'Create Promotion, Collection, Story and Reel concepts using only vendor-owned records.',
        examples: [
          'Draft a Product Story',
          'Build a Reel concept',
          'Suggest a Promotion bundle'
        ]
      },
      {
        id:
          'vendor-readiness',
        title:
          'Check readiness',
        description:
          'Identify missing fields and likely approval blockers before a submission is made.',
        examples: [
          'Check whether this is ready',
          'Explain the approval blocker',
          'Prepare a cleaner revision'
        ]
      },
      {
        id:
          'vendor-guidance',
        title:
          'Use performance signals',
        description:
          'Translate vendor analytics into practical suggestions without exposing another Vendor’s information.',
        examples: [
          'Summarise Product interest',
          'Suggest what to promote next',
          'Explain campaign performance'
        ]
      }
    ],
    authorityRules: [
      'AJ can access only records owned by the active Vendor Profile inside the current workspace.',
      'A new Product is created only as an inactive vendor-owned Draft.',
      'You must complete media, variants, price and stock before submitting the Product.',
      'Workspace approval remains required for controlled public changes.'
    ],
    preparationSteps: [
      'Confirm your vendor account and permissions',
      'Read vendor-owned catalog and media signals',
      'Prepare a clear Product or campaign draft',
      'Wait for your review and confirmation',
      'Continue through the normal submission workflow'
    ]
  },
  customer: {
    audience:
      'customer',
    eyebrow:
      'Shelsea · Living Intelligence',
    title:
      'AJ Intelligence',
    description:
      'A living planning and decision workspace for discovering products, comparing choices, shaping occasions and building useful Shopping Lists.',
    contextDescription:
      'I use available products, your current interests, recent views and Shopping Lists to prepare helpful suggestions.',
    capabilities: [
      {
        id:
          'customer-picks',
        title:
          'Find suitable Products',
        description:
          'Recommend relevant Products from the live workspace using your current shopping intent.',
        examples: [
          'Show similar Products',
          'Suggest something new',
          'Continue from my recent views'
        ]
      },
      {
        id:
          'customer-compare',
        title:
          'Compare choices',
        description:
          'Explain useful differences between Products, variants, availability and intended use.',
        examples: [
          'Compare these Products',
          'Explain the best variant',
          'Find an available alternative'
        ]
      },
      {
        id:
          'customer-pairing',
        title:
          'Plan pairings and occasions',
        description:
          'Build food, drink, confectionery, gift and celebration combinations from available Products.',
        examples: [
          'Create a dinner pairing',
          'Plan a celebration basket',
          'Suggest a gift combination'
        ]
      },
      {
        id:
          'customer-plans',
        title:
          'Build Shopping Lists',
        description:
          'Organise Products into a reusable private plan while you remain in control.',
        examples: [
          'Build a party Shopping List',
          'Complete this existing List',
          'Suggest missing essentials'
        ]
      }
    ],
    authorityRules: [
      'Suggestions use products currently available in this store.',
      'Your personalization and privacy choices remain respected.',
      'AJ may prepare a Shopping List but cannot place an Order or make a payment for you.',
      'AJ explains uncertainty when Product, stock or preference information is incomplete.'
    ],
    preparationSteps: [
      'Understand the shopping request',
      'Check the live catalog and availability',
      'Prepare clear recommendations',
      'Wait for your selection',
      'Save only the action you explicitly confirm'
    ]
  }
};

export function getAssistantProfile(
  audience:
    AIAssistantAudience
): AIAssistantProfile {
  return profiles[
    audience
  ];
}
