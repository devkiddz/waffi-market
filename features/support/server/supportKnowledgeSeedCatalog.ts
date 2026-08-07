import type { SupportKnowledgeSeedEntry } from '../supportKnowledgeTypes';

export const AJ_LOGIK_SUPPORT_KNOWLEDGE_SEED:
  readonly SupportKnowledgeSeedEntry[] = [
    {
      slug: 'greeting',
      title: 'Greeting and welcome',
      category: 'CONVERSATION',
      intent: 'GREETING',
      primaryQuestion: 'Hello',
      answerTemplate:
        'Hi 👋 Welcome to Shelsea. I am AJ Support Intelligence. I can help you understand the platform, shop, find the right order or delivery support, or connect you to a human agent when personal attention is needed.',
      clarificationAnswer:
        'What can I help you with today?',
      escalationAnswer: null,
      keywords: [
        'hello',
        'hi',
        'hey',
        'greeting',
        'welcome',
        'morning',
        'afternoon',
        'evening'
      ],
      synonyms: [
        'good day',
        'how are you',
        'how far',
        'what is up',
        'wetin dey happen'
      ],
      actions: [
        {
          id: 'greeting-shopping-help',
          label: 'Shopping help',
          kind: 'FOLLOW_UP',
          prompt: 'How do I buy on Shelsea?'
        },
        {
          id: 'greeting-platform-help',
          label: 'About Shelsea',
          kind: 'FOLLOW_UP',
          prompt: 'What is Shelsea?'
        }
      ],
      status: 'ACTIVE',
      priority: 130,
      confidenceThreshold: 0.55,
      examples: [
        { text: 'Hi' },
        { text: 'Hello' },
        { text: 'Hey' },
        { text: 'Hi AJ' },
        { text: 'Hello AJ' },
        { text: 'Hi there' },
        { text: 'Hello there' },
        { text: 'Good morning' },
        { text: 'Good afternoon' },
        { text: 'Good evening' },
        { text: 'Good day' },
        { text: 'How are you?' },
        { text: 'How far?' },
        { text: "What's up?" },
        { text: 'Wetin dey happen?' }
      ]
    },
    {
      slug: 'what-is-aj-logik',
      title: 'What Shelsea is',
      category: 'PLATFORM',
      intent: 'HOW_TO_USE_APP',
      primaryQuestion: 'What is Shelsea?',
      answerTemplate:
        'Shelsea is a discovery-led commerce marketplace for wines, spirits, meals, confectioneries, party essentials and other approved products. You can shop from approved vendors, manage orders and request human Support whenever a situation needs personal attention.',
      clarificationAnswer:
        'Would you like help shopping, understanding vendors, or using your account?',
      escalationAnswer:
        'I can connect you to a human Support agent for a more detailed explanation.',
      keywords: ['aj logik', 'platform', 'marketplace', 'what is'],
      synonyms: ['ajlojik', 'app', 'website'],
      actions: [{ id: 'browse-store', label: 'Browse Store', kind: 'NAVIGATE', href: '/store' }],
      status: 'ACTIVE',
      priority: 100,
      confidenceThreshold: 0.7,
      examples: [
        { text: 'What is Shelsea?' },
        { text: 'What does Shelsea do?' },
        { text: 'How does this platform work?' }
      ]
    },
    {
      slug: 'what-is-aj-liqz',
      title: 'What AJ Liqz means',
      category: 'PLATFORM',
      intent: 'HOW_TO_USE_APP',
      primaryQuestion: 'What is AJ Liqz?',
      answerTemplate:
        'AJ Liqz is the Shelsea shopping experience focused on approved wines, spirits and related drink selections. Availability, delivery eligibility and age-verification requirements may depend on the customer, location and current marketplace rules.',
      clarificationAnswer:
        'Are you looking for a product, delivery information, or a recommendation?',
      escalationAnswer:
        'A human agent can help when your request involves eligibility, policy or a specific product.',
      keywords: ['aj liqz', 'liqz', 'wine', 'spirits', 'drinks'],
      synonyms: ['liquor', 'alcohol'],
      status: 'ACTIVE',
      priority: 95,
      confidenceThreshold: 0.68,
      examples: [
        { text: 'What is AJ Liqz?' },
        { text: 'What does Liqz mean?' },
        { text: 'Is AJ Liqz for drinks?' }
      ]
    },
    {
      slug: 'how-to-buy',
      title: 'How to buy on Shelsea',
      category: 'SHOPPING',
      intent: 'HOW_TO_BUY',
      primaryQuestion: 'How do I buy on Shelsea?',
      answerTemplate:
        'Browse the Store, open a product, choose an available variant, add it to your Cart and continue to Checkout. Confirm quantities, delivery details and payment information before placing the order.',
      clarificationAnswer:
        'Which step is difficult: finding a product, adding to Cart, Checkout or payment?',
      escalationAnswer:
        'I can connect you to a human agent if the shopping flow is not working as expected.',
      keywords: ['buy', 'purchase', 'shop', 'checkout', 'cart'],
      synonyms: ['order', 'pay'],
      actions: [
        { id: 'open-store', label: 'Open Store', kind: 'NAVIGATE', href: '/store' },
        { id: 'open-cart', label: 'Open Cart', kind: 'NAVIGATE', href: '/cart' }
      ],
      status: 'ACTIVE',
      priority: 90,
      confidenceThreshold: 0.64,
      examples: [
        { text: 'How do I buy?' },
        { text: 'How can I place an order?' },
        { text: 'I want to purchase something' },
        { text: 'How do I checkout?' }
      ]
    },
    {
      slug: 'multivendor-marketplace',
      title: 'How vendors work',
      category: 'VENDOR',
      intent: 'MULTIVENDOR_AVAILABILITY',
      primaryQuestion: 'Is Shelsea a multivendor marketplace?',
      answerTemplate:
        'Yes. Shelsea supports approved vendors inside one marketplace experience. Products may belong to different vendors, while preparation, fulfilment and delivery arrangements can remain separated where necessary. The current order details remain authoritative for a specific purchase.',
      clarificationAnswer:
        'Are you asking as a customer or as a business interested in becoming a vendor?',
      escalationAnswer:
        'A human agent can explain the arrangement for a specific order or vendor.',
      keywords: ['vendor', 'seller', 'multivendor', 'marketplace'],
      synonyms: ['different sellers', 'many vendors'],
      status: 'ACTIVE',
      priority: 85,
      confidenceThreshold: 0.68,
      examples: [
        { text: 'Is Shelsea multivendor?' },
        { text: 'Are there different sellers?' },
        { text: 'Can I buy from many vendors?' }
      ]
    },
    {
      slug: 'track-order',
      title: 'Track an order',
      category: 'ORDER',
      intent: 'ORDER_TRACKING',
      primaryQuestion: 'Where is my order?',
      answerTemplate:
        'Open Orders and select the relevant order to view its latest confirmed state. When a delivery record exists, its tracking information is authoritative. I should not guess an order or delivery state that is not present in your account.',
      clarificationAnswer:
        'Which order should I check? Provide the order number or open the relevant order.',
      escalationAnswer:
        'I could not safely verify the order state. I can connect this conversation to a human Support agent.',
      keywords: ['order', 'track', 'where', 'status', 'arrive'],
      synonyms: ['package', 'purchase', 'wine', 'delivery'],
      requiredContext: ['customer', 'order'],
      actions: [{ id: 'open-orders', label: 'Open Orders', kind: 'NAVIGATE', href: '/account/orders' }],
      status: 'ACTIVE',
      priority: 100,
      confidenceThreshold: 0.62,
      examples: [
        { text: 'Where is my order?' },
        { text: 'Track my order' },
        { text: 'My delivery never reach' },
        { text: 'Where my wine dey?' },
        { text: 'When will my package arrive?' }
      ]
    },
    {
      slug: 'delivery-help',
      title: 'Delivery help',
      category: 'DELIVERY',
      intent: 'DELIVERY_HELP',
      primaryQuestion: 'I need help with my delivery',
      answerTemplate:
        'The latest confirmed delivery record should be used for status, tracking and fulfilment information. If the expected time has passed, the record is missing or the states conflict, a human agent should review the case.',
      clarificationAnswer:
        'Is the delivery late, missing, going to the wrong address, or showing a confusing status?',
      escalationAnswer:
        'I can open or continue a Support Case so a human agent can investigate the delivery.',
      keywords: ['delivery', 'late', 'address', 'driver', 'tracking'],
      synonyms: ['dispatch', 'package', 'arrive'],
      requiredContext: ['customer', 'delivery'],
      status: 'ACTIVE',
      priority: 96,
      confidenceThreshold: 0.62,
      examples: [
        { text: 'My delivery is late' },
        { text: 'I have a delivery problem' },
        { text: 'My package has not arrived' }
      ]
    },
    {
      slug: 'payment-help',
      title: 'Payment help',
      category: 'PAYMENT',
      intent: 'PAYMENT_HELP',
      primaryQuestion: 'I need help with a payment',
      answerTemplate:
        'Use the payment and order records shown in your account as the verified source. A debit alert alone does not prove that an Shelsea order or payment completed. Do not repeat payment until the current state has been checked.',
      clarificationAnswer:
        'Was your account debited, did payment fail, or is the order still showing pending?',
      escalationAnswer:
        'Payment conflicts, duplicate charges and refunds should be reviewed by an authorised human agent.',
      keywords: ['payment', 'paid', 'debit', 'charged', 'pending', 'failed'],
      synonyms: ['money', 'transaction', 'paystack'],
      requiredContext: ['customer', 'payment'],
      status: 'ACTIVE',
      priority: 100,
      confidenceThreshold: 0.65,
      examples: [
        { text: 'Payment help' },
        { text: 'I was debited' },
        { text: 'My payment is pending' },
        { text: 'Payment failed but money left my account' }
      ]
    },
    {
      slug: 'product-availability',
      title: 'Product availability',
      category: 'PRODUCT',
      intent: 'PRODUCT_AVAILABILITY',
      primaryQuestion: 'Is this product available?',
      answerTemplate:
        'Current product and variant stock shown in Shelsea is the verified availability source. Availability can change before Checkout, so the selected variant must still be active and in stock when the order is placed.',
      clarificationAnswer:
        'Which product and variant would you like me to help identify?',
      escalationAnswer:
        'A human agent can help when the listing and available stock appear inconsistent.',
      keywords: ['available', 'stock', 'product', 'variant', 'sold out'],
      synonyms: ['have', 'remain', 'left'],
      requiredContext: ['product'],
      status: 'ACTIVE',
      priority: 80,
      confidenceThreshold: 0.64,
      examples: [
        { text: 'Is this product available?' },
        { text: 'Do you still have this wine?' },
        { text: 'Is it in stock?' }
      ]
    },
    {
      slug: 'alcohol-delivery-eligibility',
      title: 'Alcohol delivery eligibility',
      category: 'DELIVERY',
      intent: 'ALCOHOL_DELIVERY_ELIGIBILITY',
      primaryQuestion: 'Can Shelsea deliver alcohol to me?',
      answerTemplate:
        'Eligible alcohol products may be delivered where the product, customer, location and current marketplace requirements permit it. Age or identity verification may be required. Shelsea should not promise eligibility without checking verified context.',
      clarificationAnswer:
        'Are you asking about your location, age verification, a product, or a current order?',
      escalationAnswer:
        'A human agent can review an eligibility or verification issue that the available records do not resolve.',
      keywords: ['alcohol', 'wine', 'spirits', 'deliver', 'location', 'age'],
      synonyms: ['drink', 'liqz', 'liquor'],
      requiredContext: ['customer', 'location', 'verification'],
      status: 'ACTIVE',
      priority: 90,
      confidenceThreshold: 0.64,
      examples: [
        { text: 'Can you deliver alcohol to me?' },
        { text: 'Do you deliver wine here?' },
        { text: 'Can una deliver drinks reach me?' },
        { text: 'Why do I need age verification?' }
      ]
    },
    {
      slug: 'shopping-lists',
      title: 'Shopping Lists',
      category: 'SHOPPING_LIST',
      intent: 'SHOPPING_LISTS',
      primaryQuestion: 'How do Shopping Lists work?',
      answerTemplate:
        'Shopping Lists are reusable shopping plans. You can create a list, add products and quantities, keep notes and later add currently available items to your Cart. Published lists and preparation requests follow their own approval and operations rules.',
      clarificationAnswer:
        'Do you want to create a list, edit one, add its items to Cart, or request preparation?',
      escalationAnswer:
        'A human agent can help with a list in an unexpected workflow state.',
      keywords: ['shopping list', 'list', 'plan', 'prepare'],
      synonyms: ['items', 'quantities'],
      status: 'ACTIVE',
      priority: 75,
      confidenceThreshold: 0.65,
      examples: [
        { text: 'How do Shopping Lists work?' },
        { text: 'Can Shelsea prepare my list?' },
        { text: 'How do I add a list to cart?' }
      ]
    },
    {
      slug: 'returns-and-refunds',
      title: 'Returns and refunds',
      category: 'ORDER',
      intent: 'RETURNS_AND_REFUNDS',
      primaryQuestion: 'Can I return an item or get a refund?',
      answerTemplate:
        'Return and refund eligibility depends on the verified order, product condition, payment state and applicable Shelsea policy. The assistant must not promise a refund or claim one was approved before an authorised review is recorded.',
      clarificationAnswer:
        'Is this about a damaged item, wrong item, cancelled order, duplicate charge or another problem?',
      escalationAnswer:
        'I can transfer this conversation to a human agent for governed review.',
      keywords: ['return', 'refund', 'damaged', 'wrong item', 'cancel'],
      synonyms: ['money back', 'replacement'],
      requiredContext: ['customer', 'order', 'payment'],
      actions: [{ id: 'refund-review', label: 'Talk to an agent', kind: 'HUMAN_HANDOFF' }],
      status: 'ACTIVE',
      priority: 98,
      confidenceThreshold: 0.66,
      examples: [
        { text: 'Can I get a refund?' },
        { text: 'I received the wrong item' },
        { text: 'My product is damaged' },
        { text: 'Can I return an opened drink?' }
      ]
    },
    {
      slug: 'human-support',
      title: 'Human Support request',
      category: 'SUPPORT',
      intent: 'HUMAN_SUPPORT',
      primaryQuestion: 'I want to talk to a human agent',
      answerTemplate:
        'Of course. I can connect this conversation to a human Support agent. Your question and automated conversation should be preserved so you do not have to start again.',
      clarificationAnswer: null,
      escalationAnswer: 'A human Support handoff is available.',
      keywords: ['human', 'agent', 'person', 'support', 'representative'],
      synonyms: ['somebody', 'real person', 'staff'],
      actions: [{ id: 'human-handoff', label: 'Talk to an agent', kind: 'HUMAN_HANDOFF' }],
      status: 'ACTIVE',
      priority: 120,
      confidenceThreshold: 0.55,
      examples: [
        { text: 'Talk to a human' },
        { text: 'I need an agent' },
        { text: 'This answer is too generic' },
        { text: 'I do not trust this response' },
        { text: 'My situation is different' }
      ]
    }
  ];
