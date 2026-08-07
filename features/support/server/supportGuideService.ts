import 'server-only';

import {
  SUPPORT_GUIDE_INTENTS
} from '../supportGuideTypes';

import type {
  SupportGuideAction,
  SupportGuideContextSnapshot,
  SupportGuideIntent,
  SupportGuideRequest,
  SupportGuideResponse
} from '../supportGuideTypes';

import {
  resolveSupportContextualIntent
} from './supportCustomerContextIntent';

import {
  resolveSupportCustomerContext
} from './supportCustomerContextResolver';

import type {
  SupportCustomerContextResolution
} from './supportCustomerContextResolver';

import {
  listActiveSupportKnowledge,
  recordSupportKnowledgeInteraction
} from './supportKnowledgeRepository';

import {
  resolveSupportKnowledgeMatch
} from './supportKnowledgeMatcher';

const MAX_QUESTION_LENGTH =
  1000;

const SUPPORT_GUIDE_INTENT_SET =
  new Set<string>(
    SUPPORT_GUIDE_INTENTS
  );

type ResolveSupportGuideInput =
  SupportGuideRequest & {
    workspaceId: string;
    customerId?: string | null;
  };

function normalizedQuestion(
  value: string
): string {
  const normalized =
    value
      .replace(
        /\s+/g,
        ' '
      )
      .trim();

  if (!normalized) {
    throw new Error(
      'Ask Shelsea Support Intelligence a question.'
    );
  }

  if (
    normalized.length >
    MAX_QUESTION_LENGTH
  ) {
    throw new Error(
      'Support questions must not exceed 1000 characters.'
    );
  }

  return normalized;
}

function asIntent(
  value: string
): SupportGuideIntent {
  return SUPPORT_GUIDE_INTENT_SET.has(
    value
  )
    ? (
        value as
          SupportGuideIntent
      )
    : 'UNKNOWN';
}

function isRecord(
  value: unknown
): value is
  Record<
    string,
    unknown
  > {
  return (
    typeof value ===
      'object' &&
    value !==
      null &&
    !Array.isArray(
      value
    )
  );
}

function parseActions(
  value: unknown
): SupportGuideAction[] {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  const actions:
    SupportGuideAction[] =
    [];

  for (
    const item of
    value
  ) {
    if (
      !isRecord(
        item
      ) ||
      typeof item.id !==
        'string' ||
      typeof item.label !==
        'string' ||
      (
        item.kind !==
          'NAVIGATE' &&
        item.kind !==
          'FOLLOW_UP' &&
        item.kind !==
          'HUMAN_HANDOFF'
      )
    ) {
      continue;
    }

    actions.push({
      id:
        item.id,
      label:
        item.label,
      kind:
        item.kind,
      href:
        typeof item.href ===
        'string'
          ? item.href
          : undefined,
      prompt:
        typeof item.prompt ===
        'string'
          ? item.prompt
          : undefined
    });
  }

  return actions;
}

function mergeActions(
  ...groups:
    readonly SupportGuideAction[][]
): SupportGuideAction[] {
  const seen =
    new Set<string>();

  return groups
    .flat()
    .filter(
      action => {
        if (
          seen.has(
            action.id
          )
        ) {
          return false;
        }

        seen.add(
          action.id
        );

        return true;
      }
    );
}

function ensureHumanAction(
  actions:
    readonly SupportGuideAction[]
): SupportGuideAction[] {
  if (
    actions.some(
      action =>
        action.kind ===
        'HUMAN_HANDOFF'
    )
  ) {
    return [
      ...actions
    ];
  }

  return [
    ...actions,
    {
      id:
        'human-handoff',
      label:
        'Talk to an agent',
      kind:
        'HUMAN_HANDOFF'
    }
  ];
}

function routeContext(
  pathname:
    string |
    null |
    undefined
): string | null {
  if (!pathname) {
    return null;
  }

  if (
    pathname.startsWith(
      '/store'
    )
  ) {
    return 'You are currently inside the Store, so you can continue browsing from the page already open.';
  }

  if (
    pathname.startsWith(
      '/cart'
    )
  ) {
    return 'You are currently inside your Cart, so review the items and quantities already shown before continuing.';
  }

  if (
    pathname.includes(
      '/orders'
    )
  ) {
    return 'You are currently inside Orders. The verified order record included above remains authoritative.';
  }

  if (
    pathname.includes(
      '/deliver'
    )
  ) {
    return 'You are currently inside the Delivery experience. The latest confirmed delivery record included above remains authoritative.';
  }

  if (
    pathname.includes(
      'shopping-list'
    )
  ) {
    return 'You are currently inside Shopping Lists, where you can continue an existing plan or create another one.';
  }

  return null;
}

function confidenceLabel(
  score: number
): 'HIGH' | 'MEDIUM' | 'LOW' {
  if (
    score >=
    0.82
  ) {
    return 'HIGH';
  }

  if (
    score >=
    0.65
  ) {
    return 'MEDIUM';
  }

  return 'LOW';
}

async function recordInteractionSafely(
  input:
    Parameters<
      typeof recordSupportKnowledgeInteraction
    >[0]
): Promise<string | null> {
  try {
    return await recordSupportKnowledgeInteraction(
      input
    );
  } catch (
    cause
  ) {
    console.error(
      'AJ Support Intelligence could not record the knowledge interaction.',
      cause
    );

    return null;
  }
}

function noMatchResponse():
  SupportGuideResponse {
  return {
    outcome:
      'NO_MATCH',
    intent:
      'UNKNOWN',
    answer:
      'I could not confirm a trustworthy Shelsea answer from the approved Support Knowledge yet.',
    followUp:
      'Could you tell me whether this is about shopping, payment, an order, delivery, your account, a product, or using Shelsea?',
    confidence:
      'LOW',
    confidenceScore:
      0,
    source:
      'CLARIFICATION',
    knowledgeEntryId:
      null,
    knowledgeEntrySlug:
      null,
    interactionId:
      null,
    requiredContext:
      [],
    context:
      null,
    shouldOfferHuman:
      true,
    actions: [
      {
        id:
          'clarify-shopping',
        label:
          'Shopping help',
        kind:
          'FOLLOW_UP',
        prompt:
          'How do I buy on Shelsea?'
      },
      {
        id:
          'clarify-order',
        label:
          'Order help',
        kind:
          'FOLLOW_UP',
        prompt:
          'Where is my order?'
      },
      {
        id:
          'clarify-human',
        label:
          'Talk to an agent',
        kind:
          'HUMAN_HANDOFF'
      }
    ]
  };
}

function unavailableResponse():
  SupportGuideResponse {
  return {
    outcome:
      'HUMAN_SUPPORT_REQUIRED',
    intent:
      'UNKNOWN',
    answer:
      'AJ Support Intelligence could not safely access the approved Support Knowledge right now.',
    followUp:
      'You can try again or continue this conversation with a human Support agent.',
    confidence:
      'LOW',
    confidenceScore:
      0,
    source:
      'SYSTEM_FALLBACK',
    knowledgeEntryId:
      null,
    knowledgeEntrySlug:
      null,
    interactionId:
      null,
    requiredContext:
      [],
    context:
      null,
    shouldOfferHuman:
      true,
    actions: [
      {
        id:
          'knowledge-unavailable-human',
        label:
          'Talk to an agent',
        kind:
          'HUMAN_HANDOFF'
      }
    ]
  };
}

function unavailableContext(
  requiredContext:
    readonly string[]
): SupportCustomerContextResolution {
  const snapshot:
    SupportGuideContextSnapshot = {
      state:
        'UNAVAILABLE',
      resolved:
        [],
      missing:
        [
          ...requiredContext
        ],
      ambiguous:
        [],
      summary: [
        'Verified customer context could not be loaded safely.'
      ],
      references:
        []
    };

  return {
    snapshot,
    narrative:
      'I found the approved Support answer, but I could not safely read the account records needed to personalise it.',
    followUp:
      'Please try again or continue with a human Support agent.',
    actions: [
      {
        id:
          'context-unavailable-human',
        label:
          'Talk to an agent',
        kind:
          'HUMAN_HANDOFF'
      }
    ],
    requiresHuman:
      true
  };
}

export async function resolveSupportGuideQuestion(
  input:
    ResolveSupportGuideInput
): Promise<SupportGuideResponse> {
  const question =
    normalizedQuestion(
      input.question
    );

  let entries:
    Awaited<
      ReturnType<
        typeof listActiveSupportKnowledge
      >
    >;

  try {
    entries =
      await listActiveSupportKnowledge(
        input.workspaceId
      );
  } catch (
    cause
  ) {
    console.error(
      'AJ Support Intelligence could not load approved Support Knowledge.',
      cause
    );

    return unavailableResponse();
  }

  if (
    !entries.length
  ) {
    const response =
      noMatchResponse();

    response.interactionId =
      await recordInteractionSafely({
        workspaceId:
          input.workspaceId,
        customerId:
          input.customerId ??
          null,
        question,
        outcome:
          'NO_MATCH',
        answer:
          response.answer,
        pathname:
          input.pathname ??
          null,
        metadata: {
          reason:
            'NO_ACTIVE_KNOWLEDGE'
        }
      });

    return response;
  }

  const resolution =
    resolveSupportKnowledgeMatch(
      question,
      entries
    );

  const contextualIntent =
    resolution.best
      ? null
      : resolveSupportContextualIntent(
          question
        );

  let best =
    resolution.best;

  if (
    !best &&
    contextualIntent
  ) {
    const contextualEntry =
      entries.find(
        entry =>
          entry.intent ===
          contextualIntent.intent
      ) ??
      null;

    if (
      contextualEntry &&
      contextualIntent.confidence >=
        contextualEntry
          .confidenceThreshold
    ) {
      best = {
        entry:
          contextualEntry,
        score:
          contextualIntent
            .confidence,
        threshold:
          contextualEntry
            .confidenceThreshold,
        evidence: {
          exactQuestion:
            false,
          phraseSimilarity:
            0,
          keywordCoverage:
            0,
          synonymCoverage:
            0,
          metadataCoverage:
            0
        }
      };
    }
  }

  if (!best) {
    const response =
      noMatchResponse();

    response.interactionId =
      await recordInteractionSafely({
        workspaceId:
          input.workspaceId,
        customerId:
          input.customerId ??
          null,
        question,
        matchedIntent:
          contextualIntent
            ?.intent ??
          null,
        confidence:
          contextualIntent
            ?.confidence ??
          null,
        outcome:
          'NO_MATCH',
        answer:
          response.answer,
        pathname:
          input.pathname ??
          null,
        metadata: {
          candidateIntent:
            resolution.runnerUp
              ?.entry
              .intent ??
            contextualIntent
              ?.intent ??
            null,
          candidateScore:
            resolution.runnerUp
              ?.score ??
            contextualIntent
              ?.confidence ??
            null,
          contextualIntent
        }
      });

    return response;
  }

  if (
    resolution.ambiguous
  ) {
    const runnerUp =
      resolution.runnerUp;

    const response:
      SupportGuideResponse = {
        outcome:
          'CLARIFICATION_REQUIRED',
        intent:
          asIntent(
            best.entry.intent
          ),
        answer:
          'I found more than one possible Shelsea Support topic and do not want to give you the wrong answer.',
        followUp:
          runnerUp
            ? `Is this about ${best.entry.title} or ${runnerUp.entry.title}?`
            : best.entry
                .clarificationAnswer ??
              'Could you provide one more detail?',
        confidence:
          confidenceLabel(
            best.score
          ),
        confidenceScore:
          best.score,
        source:
          'CLARIFICATION',
        knowledgeEntryId:
          best.entry.id,
        knowledgeEntrySlug:
          best.entry.slug,
        interactionId:
          null,
        requiredContext:
          [],
        context:
          null,
        shouldOfferHuman:
          true,
        actions:
          ensureHumanAction(
            []
          )
      };

    response.interactionId =
      await recordInteractionSafely({
        workspaceId:
          input.workspaceId,
        customerId:
          input.customerId ??
          null,
        entryId:
          best.entry.id,
        question,
        matchedIntent:
          best.entry.intent,
        confidence:
          best.score,
        outcome:
          'CLARIFICATION_REQUIRED',
        answer:
          response.answer,
        pathname:
          input.pathname ??
          null,
        metadata: {
          entrySlug:
            best.entry.slug,
          runnerUpSlug:
            runnerUp
              ?.entry
              .slug ??
            null,
          runnerUpScore:
            runnerUp
              ?.score ??
            null,
          evidence:
            best.evidence
        }
      });

    return response;
  }

  const intent =
    asIntent(
      best.entry.intent
    );

  const originalRequiredContext =
    [
      ...best.entry
        .requiredContext
    ];

  let customerContext:
    SupportCustomerContextResolution | null =
      null;

  if (
    originalRequiredContext.length
  ) {
    if (
      !input.customerId
    ) {
      customerContext =
        unavailableContext(
          originalRequiredContext
        );
    } else {
      try {
        customerContext =
          await resolveSupportCustomerContext({
            workspaceId:
              input.workspaceId,
            customerId:
              input.customerId,
            question,
            pathname:
              input.pathname,
            intent,
            requiredContext:
              originalRequiredContext
          });
      } catch (
        cause
      ) {
        console.error(
          'AJ Support Intelligence could not resolve verified customer context.',
          cause
        );

        customerContext =
          unavailableContext(
            originalRequiredContext
          );
      }
    }
  }

  const humanRequested =
    intent ===
    'HUMAN_SUPPORT';

  const contextIncomplete =
    Boolean(
      customerContext &&
        customerContext
          .snapshot
          .state !==
          'RESOLVED' &&
        customerContext
          .snapshot
          .state !==
          'NOT_REQUIRED'
    );

  const outcome =
    humanRequested
      ? 'HUMAN_SUPPORT_REQUIRED'
      : contextIncomplete
        ? 'CONTEXT_REQUIRED'
        : 'ANSWERED';

  const configuredActions =
    parseActions(
      best.entry.actions
    );

  let actions =
    mergeActions(
      configuredActions,
      customerContext
        ?.actions ??
        []
    );

  const shouldOfferHuman =
    humanRequested ||
    Boolean(
      customerContext
        ?.requiresHuman
    ) ||
    actions.some(
      action =>
        action.kind ===
        'HUMAN_HANDOFF'
    );

  if (
    shouldOfferHuman
  ) {
    actions =
      ensureHumanAction(
        actions
      );
  }

  const pathnameContext =
    routeContext(
      input.pathname
    );

  const answer =
    [
      best.entry
        .answerTemplate,
      customerContext
        ?.narrative ??
        null,
      pathnameContext
    ]
      .filter(
        (
          value
        ): value is string =>
          Boolean(
            value
          )
      )
      .join(
        '\n\n'
      );

  const response:
    SupportGuideResponse = {
      outcome,
      intent,
      answer,
      followUp:
        customerContext
          ?.followUp ??
        best.entry
          .clarificationAnswer,
      confidence:
        confidenceLabel(
          best.score
        ),
      confidenceScore:
        best.score,
      source:
        (
          customerContext
            ?.snapshot
            .resolved
            .length ||
          pathnameContext
        )
          ? 'LIVE_CONTEXT'
          : 'DATABASE_KNOWLEDGE',
      knowledgeEntryId:
        best.entry.id,
      knowledgeEntrySlug:
        best.entry.slug,
      interactionId:
        null,
      requiredContext:
        customerContext
          ? [
              ...customerContext
                .snapshot
                .missing,
              ...customerContext
                .snapshot
                .ambiguous
            ]
          : [],
      context:
        customerContext
          ?.snapshot ??
        null,
      shouldOfferHuman,
      actions
    };

  response.interactionId =
    await recordInteractionSafely({
      workspaceId:
        input.workspaceId,
      customerId:
        input.customerId ??
        null,
      entryId:
        best.entry.id,
      question,
      matchedIntent:
        best.entry.intent,
      confidence:
        best.score,
      outcome,
      answer:
        response.answer,
      humanRequested:
        humanRequested ||
        Boolean(
          customerContext
            ?.requiresHuman
        ),
      pathname:
        input.pathname ??
        null,
      metadata: {
        entrySlug:
          best.entry.slug,
        entryVersion:
          best.entry.version,
        category:
          best.entry.category,
        requestedContext:
          originalRequiredContext,
        context:
          customerContext
            ?.snapshot ??
          null,
        contextualIntent,
        evidence:
          best.evidence
      }
    });

  return response;
}
