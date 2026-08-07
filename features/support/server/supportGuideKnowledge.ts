import type {
  SupportGuideAction,
  SupportGuideIntent
} from '../supportGuideTypes';

export type SupportGuideKnowledgeEntry = {
  intent: Exclude<
    SupportGuideIntent,
    'UNKNOWN'
  >;
  patterns: readonly RegExp[];
  answer: string;
  followUp: string | null;
  actions: readonly SupportGuideAction[];
};

export const supportGuideKnowledge:
  readonly SupportGuideKnowledgeEntry[] = [
    {
      intent:
        'HOW_TO_BUY',
      patterns: [
        /\bhow\b.*\b(buy|purchase|order)\b/i,
        /\bhow do i (shop|checkout)\b/i,
        /\bplace an order\b/i
      ],
      answer:
        'It is straightforward 😊 Browse the Store, open a product, choose the available option or size, and add it to your cart. When you are ready, open your cart, confirm the quantities, and continue to checkout.',
      followUp:
        'Are you still browsing, looking at a product, or already inside your cart?',
      actions: [
        {
          id:
            'browse-products',
          label:
            'Browse products',
          href:
            '/store',
          kind:
            'NAVIGATE'
        },
        {
          id:
            'open-cart',
          label:
            'Open cart',
          href:
            '/cart',
          kind:
            'NAVIGATE'
        }
      ]
    },
    {
      intent:
        'HOW_TO_USE_APP',
      patterns: [
        /\bhow\b.*\b(use|navigate)\b.*\b(app|site|website|aj logik)\b/i,
        /\bwhat can i do here\b/i,
        /\bi am (lost|confused)\b/i
      ],
      answer:
        'Shelsea is designed around your shopping journey. Use the Store to discover products, the cart to prepare checkout, Orders to follow purchases, Deliveries to track fulfilment, Shopping Lists to plan ahead, and Support whenever something needs human attention.',
      followUp:
        'Which part are you trying to use right now?',
      actions: [
        {
          id:
            'open-store',
          label:
            'Open Store',
          href:
            '/store',
          kind:
            'NAVIGATE'
        },
        {
          id:
            'open-orders',
          label:
            'View orders',
          href:
            '/account/orders',
          kind:
            'NAVIGATE'
        }
      ]
    },
    {
      intent:
        'CART_AND_CHECKOUT',
      patterns: [
        /\b(cart|checkout)\b/i,
        /\bcomplete my order\b/i,
        /\bchange quantity\b/i
      ],
      answer:
        'Your cart keeps the products and quantities you intend to buy. Review every item, adjust quantities where necessary, remove anything you no longer need, then continue to checkout to confirm delivery and payment information.',
      followUp:
        'Is the difficulty with an item, quantity, delivery information, or the checkout button?',
      actions: [
        {
          id:
            'cart',
          label:
            'Open cart',
          href:
            '/cart',
          kind:
            'NAVIGATE'
        }
      ]
    },
    {
      intent:
        'PAYMENT_HELP',
      patterns: [
        /\b(payment|paystack|card|charged|debit|transaction)\b/i,
        /\bpayment failed\b/i
      ],
      answer:
        'Payment status must be confirmed from the live order record. Do not retry repeatedly if you were debited. Open the affected order first and check its payment state; when the status is unclear or money was deducted, a Support agent should inspect it.',
      followUp:
        'Were you debited, did the payment fail before debit, or are you trying to choose a payment method?',
      actions: [
        {
          id:
            'orders-payment',
          label:
            'View my orders',
          href:
            '/account/orders',
          kind:
            'NAVIGATE'
        },
        {
          id:
            'payment-human',
          label:
            'Ask a Support agent',
          kind:
            'HUMAN_HANDOFF'
        }
      ]
    },
    {
      intent:
        'ORDER_TRACKING',
      patterns: [
        /\b(track|where is|status)\b.*\b(order|purchase)\b/i,
        /\bmy order\b/i
      ],
      answer:
        'Open your Orders area and select the relevant order. Its current preparation, payment, fulfilment and delivery information should appear there. I will not guess an order status that has not been resolved from your account.',
      followUp:
        'Do you know the order number, or are you trying to find the most recent order?',
      actions: [
        {
          id:
            'orders',
          label:
            'View my orders',
          href:
            '/account/orders',
          kind:
            'NAVIGATE'
        }
      ]
    },
    {
      intent:
        'DELIVERY_HELP',
      patterns: [
        /\b(delivery|rider|dispatch|arrival)\b/i,
        /\bwhen.*arrive\b/i
      ],
      answer:
        'Delivery information belongs to the live delivery record attached to your order. Open Deliveries or the order details to view the latest confirmed state. If the shown state appears delayed or incorrect, hand it to Support for investigation.',
      followUp:
        'Are you checking an estimated arrival, a delayed delivery, or a completed delivery you did not receive?',
      actions: [
        {
          id:
            'deliveries',
          label:
            'View deliveries',
          href:
            '/account/deliveries',
          kind:
            'NAVIGATE'
        },
        {
          id:
            'delivery-human',
          label:
            'Report a delivery issue',
          kind:
            'HUMAN_HANDOFF'
        }
      ]
    },
    {
      intent:
        'ACCOUNT_HELP',
      patterns: [
        /\b(account|profile|password|sign in|login|email)\b/i
      ],
      answer:
        'Your account protects orders, Support history, saved lists and personalised shopping activity. Account changes should be made only from your secured account area. For access problems, avoid sharing passwords or verification codes with anyone.',
      followUp:
        'Are you unable to sign in, trying to update your details, or looking for something saved in your account?',
      actions: [
        {
          id:
            'account',
          label:
            'Open account',
          href:
            '/account',
          kind:
            'NAVIGATE'
        }
      ]
    },
    {
      intent:
        'SHOPPING_LISTS',
      patterns: [
        /\b(shopping list|shopping lists|list)\b/i
      ],
      answer:
        'Shopping Lists help you plan products before placing an order. You can create a list, add products, adjust quantities, keep notes, and return later without mixing the plan with your active cart.',
      followUp:
        'Would you like to create a new list or continue an existing one?',
      actions: [
        {
          id:
            'shopping-lists',
          label:
            'Open shopping lists',
          href:
            '/account/shopping-lists',
          kind:
            'NAVIGATE'
        }
      ]
    },
    {
      intent:
        'VENDOR_CONTACT',
      patterns: [
        /\b(contact|message|chat|talk)\b.*\b(vendor|seller|store)\b/i
      ],
      answer:
        'Shelsea can connect customer questions to the relevant approved vendor where vendor communication is available. Product, order and vendor context should be preserved so you do not have to explain the same issue repeatedly.',
      followUp:
        'Is your question about a product before purchase or an item already included in an order?',
      actions: [
        {
          id:
            'vendor-human',
          label:
            'Ask Support to connect me',
          kind:
            'HUMAN_HANDOFF'
        }
      ]
    },
    {
      intent:
        'RETURNS_AND_REFUNDS',
      patterns: [
        /\b(return|refund|replacement|replace)\b/i
      ],
      answer:
        'Returns, refunds and replacements depend on the affected order, product condition, payment record and the approved Shelsea policy for that case. I should not promise an outcome before those details are reviewed.',
      followUp:
        'Is the item damaged, incorrect, missing, or simply no longer wanted?',
      actions: [
        {
          id:
            'refund-human',
          label:
            'Open a Support review',
          kind:
            'HUMAN_HANDOFF'
        }
      ]
    },
    {
      intent:
        'HUMAN_SUPPORT',
      patterns: [
        /\b(human|agent|person|representative)\b/i,
        /\btalk to support\b/i,
        /\bthis did not help\b/i
      ],
      answer:
        'Understood. This needs a person from the Support team rather than another general answer. I can carry this Guide conversation into a secure Support Case so you will not have to start again.',
      followUp:
        null,
      actions: [
        {
          id:
            'human-handoff',
          label:
            'Continue with a human',
          kind:
            'HUMAN_HANDOFF'
        }
      ]
    }
  ];
