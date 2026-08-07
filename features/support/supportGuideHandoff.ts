import type {
  SupportGuideHandoffDraft,
  SupportGuideIntent,
  SupportGuideMessage,
  SupportGuideResponse
} from './supportGuideTypes';

const CATEGORY_BY_INTENT:
  Record<
    SupportGuideIntent,
    SupportGuideHandoffDraft['category']
  > = {
    GREETING:
      'OTHER',
    HOW_TO_BUY:
      'OTHER',
    HOW_TO_USE_APP:
      'TECHNICAL',
    MULTIVENDOR_AVAILABILITY:
      'VENDOR',
    CART_AND_CHECKOUT:
      'OTHER',
    PAYMENT_HELP:
      'PAYMENT',
    ORDER_TRACKING:
      'ORDER',
    DELIVERY_HELP:
      'DELIVERY',
    ACCOUNT_HELP:
      'ACCOUNT',
    SHOPPING_LISTS:
      'SHOPPING_LIST',
    VENDOR_CONTACT:
      'VENDOR',
    RETURNS_AND_REFUNDS:
      'ORDER',
    PRODUCT_AVAILABILITY:
      'PRODUCT',
    ALCOHOL_DELIVERY_ELIGIBILITY:
      'DELIVERY',
    PARTY_PLANNING:
      'OTHER',
    HUMAN_SUPPORT:
      'OTHER',
    UNKNOWN:
      'OTHER'
  };

const INTENT_LABEL:
  Record<
    SupportGuideIntent,
    string
  > = {
    GREETING:
      'General Support',
    HOW_TO_BUY:
      'Shopping help',
    HOW_TO_USE_APP:
      'Using Shelsea',
    MULTIVENDOR_AVAILABILITY:
      'Vendor marketplace help',
    CART_AND_CHECKOUT:
      'Cart and checkout help',
    PAYMENT_HELP:
      'Payment help',
    ORDER_TRACKING:
      'Order tracking help',
    DELIVERY_HELP:
      'Delivery help',
    ACCOUNT_HELP:
      'Account help',
    SHOPPING_LISTS:
      'Shopping List help',
    VENDOR_CONTACT:
      'Vendor help',
    RETURNS_AND_REFUNDS:
      'Return or refund help',
    PRODUCT_AVAILABILITY:
      'Product availability help',
    ALCOHOL_DELIVERY_ELIGIBILITY:
      'Alcohol delivery help',
    PARTY_PLANNING:
      'Party planning help',
    HUMAN_SUPPORT:
      'Human Support request',
    UNKNOWN:
      'Support request'
  };

function referenceId(
  response:
    SupportGuideResponse | null,
  kind:
    'ORDER' |
    'DELIVERY'
): string | null {
  return (
    response
      ?.context
      ?.references
      .find(
        reference =>
          reference.kind ===
          kind &&
          Boolean(
            reference.id
          )
      )
      ?.id ??
    null
  );
}

function priority(
  response:
    SupportGuideResponse | null
): SupportGuideHandoffDraft['priority'] {
  if (
    response?.intent ===
      'PAYMENT_HELP' ||
    response?.intent ===
      'ACCOUNT_HELP'
  ) {
    return 'HIGH';
  }

  if (
    response?.source ===
      'SYSTEM_FALLBACK'
  ) {
    return 'HIGH';
  }

  return 'NORMAL';
}

export function buildSupportGuideHandoffDraft(
  response:
    SupportGuideResponse | null,
  pathname:
    string |
    null |
    undefined
): SupportGuideHandoffDraft {
  const intent =
    response?.intent ??
    'UNKNOWN';

  return {
    category:
      CATEGORY_BY_INTENT[
        intent
      ],
    priority:
      priority(
        response
      ),
    subject:
      `AJ Intelligence: ${INTENT_LABEL[intent]}`,
    orderId:
      referenceId(
        response,
        'ORDER'
      ),
    deliveryId:
      referenceId(
        response,
        'DELIVERY'
      ),
    vendorProfileId:
      null,
    interactionId:
      response
        ?.interactionId ??
      null,
    metadata: {
      source:
        'AJ_SUPPORT_INTELLIGENCE',
      guideIntent:
        intent,
      guideOutcome:
        response
          ?.outcome ??
        null,
      guideSource:
        response
          ?.source ??
        null,
      guideConfidence:
        response
          ?.confidence ??
        null,
      guideConfidenceScore:
        response
          ?.confidenceScore ??
        null,
      knowledgeEntryId:
        response
          ?.knowledgeEntryId ??
        null,
      knowledgeEntrySlug:
        response
          ?.knowledgeEntrySlug ??
        null,
      supportKnowledgeInteractionId:
        response
          ?.interactionId ??
        null,
      pathname:
        pathname ??
        null,
      context:
        response
          ?.context ??
        null
    }
  };
}

export function supportGuideTranscript(
  messages:
    readonly SupportGuideMessage[]
): string {
  const transcript =
    messages
      .map(
        item =>
          `${item.role === 'CUSTOMER' ? 'Customer' : 'AJ Support Intelligence'}: ${item.body}`
      )
      .join(
        '\n\n'
      )
      .slice(
        0,
        5000
      );

  return [
    'The customer requested a human handoff from AJ Support Intelligence.',
    '',
    transcript
  ].join(
    '\n'
  );
}
