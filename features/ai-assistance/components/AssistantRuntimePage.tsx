'use client';

/* AJ_MS12_JOURNEY_SUMMARY_COMPLETION_V1 */

/* AJ_MS12_UNIFIED_JOURNEY_SUGGESTION_RAIL_V2 */

/* AJ_MS12_INTELLIGENCE_READABILITY_PASS_V1 */

/* AJ_MS12_GUIDED_COMPOSER_COMPOSITION_V4 */
/* AJ_MS12_PLAN_AUTHORITY_BUDGET_GUIDANCE */

/* AJ_MS12_STATE_AWARE_TRANSITIONS_TYPE_REPAIR */

/* AJ_MS12_UNIFIED_JOURNEY_INPUT */

/* AJ_MS12_CALM_WORKSPACE_CLEANUP_V3 */
/* AJ_MS12_JOURNEY_BUCKET_MANAGEMENT */
/* AJ_MS12_JOURNEY_CONFIRMATION_DIALOG */

/* AJ_ASSISTANCE_WORKSPACE_STAGE_1 */
/* AJ_ASSISTANCE_WORKSPACE_STAGE_3 */
/* AJ_ASSISTANCE_WORKSPACE_STAGE_5 */

import { JourneyDeleteDialog } from './JourneyDeleteDialog';

import { JourneyNavigationRail } from './JourneyNavigationRail';

import { IntelligenceWorkspace } from '@/features/intelligence/components';

import { useCallback, useEffect, useState, type ChangeEvent, type KeyboardEvent } from 'react';

import Link from 'next/link';

import {
  Archive,
  Bot,
  BrainCircuit,
  ChevronRight,
  Clock3,
  History,
  LoaderCircle,
  LockKeyhole,
  MessageSquarePlus,
  PanelLeftClose,
  PanelLeftOpen,
  Send,
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  Database,
  Pencil,
  Save,
  Trash2,
  X
} from 'lucide-react';

import { useWorkspace } from '@/features/workspace';

import { useIdentity } from '@/providers/IdentityProvider';

import { getAssistantProfile } from '../assistantProfiles';

import { resolveJourneyBudgetGuidance } from '../journeyBudgetGuidance';

import { resolveAssistantSuggestedPrompts } from '../contextualPrompts';

import type {
  AIAssistantApplicationView,
  AIAssistantAudience,
  AIAssistantFeedbackValue,
  AIAssistantRuntimeContext,
  AIAssistantSessionSummary,
  AIAssistantSessionView
} from '../contracts';

import { JourneyClarificationCard } from './JourneyClarificationCard';

import { JourneyProgressStrip } from './JourneyProgressStrip';

import { GuidedAssistantExperience } from './GuidedAssistantExperience';

import {
  JourneyCompletionDialog
} from './JourneyCompletionDialog';

import {
  JourneySummaryCard
} from './JourneySummaryCard';

const MS9_01_GUIDED_AI_INTERACTION = true;

type AssistantActivityStage =
  | 'understanding'
  | 'checking-context'
  | 'exploring-options'
  | 'preparing-response';

const ASSISTANT_ACTIVITY_STAGES: Array<{
  id: AssistantActivityStage;
  label: string;
}> = [
  {
    id: 'understanding',
    label: 'Thinking about what you need…'
  },
  {
    id: 'checking-context',
    label: 'Checking your current activity…'
  },
  {
    id: 'exploring-options',
    label: 'Looking through the strongest options…'
  },
  {
    id: 'preparing-response',
    label: 'Preparing something helpful…'
  }
];

function createCapabilityLabel(prompt: string) {
  const cleanPrompt = prompt.trim();

  if (!cleanPrompt) {
    return 'I can help you get started';
  }

  const lowerFirst = cleanPrompt.charAt(0).toLowerCase() + cleanPrompt.slice(1);

  if (
    /^(help|show|find|compare|create|build|plan|prepare|suggest|explain|summarise|summarize|continue|check|prioritise|prioritize|draft|improve|identify|submit|review|complete|use)/i.test(
      cleanPrompt
    )
  ) {
    return `I can ${lowerFirst}`;
  }

  return `I can help you ${lowerFirst}`;
}

function journeyStageLabel(stage: AIAssistantSessionView['journeyStage']) {
  if (stage === 'READY') {
    return 'Ready to decide';
  }

  return stage
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/(^|\s)\S/g, character => character.toUpperCase());
}

type JourneyCompletionRequest = {
  mode:
    'draft' |
    'complete';
  unresolved:
    string[];
};

type JourneyDeleteRequest =
  | {
      mode: 'single';
      sessionId: string;
      title: string;
    }
  | {
      mode: 'all';
      count: number;
    };

type JourneyInputSource = 'typed' | 'suggested';

type AssistantRuntimePageProps = {
  audience: AIAssistantAudience;
  contextLabel: string;
  initialWorkspaceId?: string | null;
  vendorProfileId?: string | null;
  initialContext?: Partial<AIAssistantRuntimeContext>;
  initialPrompt?: string;
};

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as T & {
    error?: string;
  };

  if (!response.ok) {
    throw new Error(payload.error ?? 'The Store Assistant could not complete that request.');
  }

  return payload;
}

function queryString(input: {
  audience: AIAssistantAudience;
  workspaceId: string;
  vendorProfileId: string | null;
}) {
  const params = new URLSearchParams({
    audience: input.audience,
    workspaceId: input.workspaceId
  });

  if (input.vendorProfileId) {
    params.set('vendorProfileId', input.vendorProfileId);
  }

  return params.toString();
}

export function AssistantRuntimePage({
  audience,
  contextLabel,
  initialWorkspaceId = null,
  vendorProfileId = null,
  initialContext = {},
  initialPrompt = ''
}: AssistantRuntimePageProps) {
  const profile = getAssistantProfile(audience);

  const { activeWorkspace, loading: workspaceLoading } = useWorkspace();

  const { isAuthenticated, isPending: identityPending } = useIdentity();

  const workspaceId = initialWorkspaceId ?? activeWorkspace?.id ?? '';

  const activeJourneyStorageKey = `aj_living_intelligence_active_journey:${audience}:${workspaceId || 'unresolved'}:${vendorProfileId ?? 'none'}`;
  const [sessions, setSessions] = useState<AIAssistantSessionSummary[]>([]);

  const [activeSession, setActiveSession] = useState<AIAssistantSessionView | null>(null);
  const promptDraftStorageKey = `aj_living_intelligence_prompt_draft:${audience}:${workspaceId || 'unresolved'}:${vendorProfileId ?? 'none'}:${activeSession?.id ?? 'new'}`;

  const [editingJourneyTitle, setEditingJourneyTitle] = useState(false);

  const [journeyTitleDraft, setJourneyTitleDraft] = useState('');

  const [prompt, setPrompt] = useState(
    initialPrompt
  );

  const [loading, setLoading] = useState(true);

  const [sending, setSending] = useState(false);

  const [activityStageIndex, setActivityStageIndex] = useState(0);

  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [deletingJourneyId, setDeletingJourneyId] = useState<string | null>(null);

  const [clearingJourneyBucket, setClearingJourneyBucket] = useState(false);

  const [journeyDeleteRequest, setJourneyDeleteRequest] = useState<JourneyDeleteRequest | null>(null);

  const [
    journeyCompletionRequest,
    setJourneyCompletionRequest
  ] =
    useState<
      JourneyCompletionRequest |
      null
    >(
      null
    );

  const [
    journeyReasoningOpen,
    setJourneyReasoningOpen
  ] =
    useState(
      false
    );

  const [error, setError] = useState<string | null>(null);

  const loadSessions = useCallback(async () => {
    if (!workspaceId || (audience === 'customer' && !isAuthenticated)) {
      setLoading(false);

      return;
    }

    setLoading(true);

    setError(null);

    try {
      const response = await fetch(
        `/api/assistant/sessions?${queryString({
          audience,
          workspaceId,
          vendorProfileId
        })}`,
        {
          cache: 'no-store'
        }
      );

      const data = await readJson<{
        sessions: AIAssistantSessionSummary[];
      }>(response);

      setSessions(data.sessions);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'Your Store Assistant conversations could not be loaded.'
      );
    } finally {
      setLoading(false);
    }
  }, [audience, isAuthenticated, vendorProfileId, workspaceId]);

  useEffect(() => {
    const task = window.setTimeout(() => void loadSessions(), 0);

    return () => window.clearTimeout(task);
  }, [loadSessions]); /* AJ_ASSISTANCE_WORKSPACE_STAGE_5_DRAFT */
  useEffect(() => {
    const savedDraft =
      window.localStorage.getItem(
        promptDraftStorageKey
      ) ??
      '';

    const task =
      window.setTimeout(
        () =>
          setPrompt(
            savedDraft ||
              initialPrompt
          ),
        0
      );

    return () =>
      window.clearTimeout(
        task
      );
  }, [
    initialPrompt,
    promptDraftStorageKey
  ]);

  useEffect(() => {
    const task = window.setTimeout(() => {
      if (prompt.trim()) {
        window.localStorage.setItem(promptDraftStorageKey, prompt);
      } else {
        window.localStorage.removeItem(promptDraftStorageKey);
      }
    }, 0);

    return () => window.clearTimeout(task);
  }, [prompt, promptDraftStorageKey]);

  useEffect(() => {
    if (!sending) {
      setActivityStageIndex(0);
      return;
    }

    const interval = window.setInterval(
      () => setActivityStageIndex(current => Math.min(current + 1, ASSISTANT_ACTIVITY_STAGES.length - 1)),
      1400
    );

    return () => window.clearInterval(interval);
  }, [sending]);

  function rememberActiveJourney(sessionId: string) {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(activeJourneyStorageKey, sessionId);
    /* AJ_STAGE5_URL_REMEMBER */
    const url = new URL(window.location.href);

    url.searchParams.set('journey', sessionId);

    window.history.replaceState(window.history.state, '', url);
  }

  function clearRememberedJourney() {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.removeItem(activeJourneyStorageKey);
    /* AJ_STAGE5_URL_CLEAR */
    const url = new URL(window.location.href);

    url.searchParams.delete('journey');

    window.history.replaceState(window.history.state, '', url);
  }

  function startNewJourney() {
    clearRememberedJourney();

    setActiveSession(null);

    setPrompt(
      initialPrompt
    );

    setError(null);
  }

  /* AJ_ASSISTANCE_WORKSPACE_RESTORE */
  useEffect(() => {
    if (loading || activeSession || !sessions.length || !workspaceId) {
      return;
    }

    const urlJourneyId = new URL(window.location.href).searchParams.get('journey');

    const rememberedId = urlJourneyId ?? window.localStorage.getItem(activeJourneyStorageKey);

    if (!rememberedId) {
      return;
    }

    if (!sessions.some(session => session.id === rememberedId)) {
      window.localStorage.removeItem(activeJourneyStorageKey);

      const url = new URL(window.location.href);

      url.searchParams.delete('journey');

      window.history.replaceState(window.history.state, '', url);

      return;
    }

    const task = window.setTimeout(() => void selectSession(rememberedId), 0);

    return () => window.clearTimeout(task);
  }, [activeJourneyStorageKey, activeSession, loading, sessions, workspaceId]);

  async function selectSession(sessionId: string) {
    if (!workspaceId) {
      return;
    }

    setLoading(true);

    setError(null);

    try {
      const response = await fetch(
        `/api/assistant/sessions/${encodeURIComponent(sessionId)}?${queryString({
          audience,
          workspaceId,
          vendorProfileId
        })}`,
        {
          cache: 'no-store'
        }
      );

      const data = await readJson<{
        session: AIAssistantSessionView;
      }>(response);

      setActiveSession(data.session);

      rememberActiveJourney(data.session.id);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : 'That Store Assistant conversation could not be opened.'
      );
    } finally {
      setLoading(false);
    }
  }

  function updateSessionSummary(session: AIAssistantSessionView) {
    setSessions(current => [
      {
        id: session.id,
        title: session.title,
        audience: session.audience,
        status: session.status,
        journeyStage: session.journeyStage,
        journeyStateVersion: session.journeyStateVersion,
        journeyState: session.journeyState,
        journeyLastTransition: session.journeyLastTransition,
        journeyGoal: session.journeyGoal,
        activePlanMessageId: session.activePlanMessageId,
        currentPlanVersion: session.currentPlanVersion,
        lastRefinedAt: session.lastRefinedAt,
        messageCount: session.messageCount,
        lastMessage: session.lastMessage,
        createdAt: session.createdAt,
        updatedAt: session.updatedAt
      },
      ...current.filter(item => item.id !== session.id)
    ]);
  }

  async function submitJourneyInput(value: string, source: JourneyInputSource) {
    const message = value.replace(/\s+/g, ' ').trim();

    if (!message || sending || !workspaceId) {
      return;
    }

    window.dispatchEvent(
      new CustomEvent('rcentz:journey-input-submitted', {
        detail: {
          source,
          sessionId: activeSession?.id ?? null
        }
      })
    );

    await sendPrompt(message);
  }

  async function sendPrompt(value = prompt) {
    const message = value.trim();

    if (!message || !workspaceId || sending) {
      return;
    }

    setSending(true);

    setError(null);

    setPrompt('');

    try {
      const response = await fetch('/api/assistant/respond', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audience,
          workspaceId,
          vendorProfileId,
          sessionId: activeSession?.id ?? null,
          message,
          context: {
            workspaceId,
            vendorProfileId,
            productId: initialContext.productId ?? null,
            category: initialContext.category ?? null,
            intent: initialContext.intent ?? null,
            mode: initialContext.mode ?? null
          }
        })
      });

      const data = await readJson<{
        session: AIAssistantSessionView;
      }>(response);

      setActiveSession(data.session);

      rememberActiveJourney(data.session.id);

      updateSessionSummary(data.session);

      window.dispatchEvent(
        new CustomEvent('rcentz:ai-intelligence-updated', {
          detail: {
            sessionId: data.session.id
          }
        })
      );
    } catch (cause) {
      setPrompt(message);

      setError(cause instanceof Error ? cause.message : 'The Store Assistant could not prepare a response.');
    } finally {
      setSending(false);
    }
  }

  function beginJourneyTitleEdit() {
    if (!activeSession) {
      return;
    }

    setJourneyTitleDraft(activeSession.title);

    setEditingJourneyTitle(true);
  }

  function cancelJourneyTitleEdit() {
    setJourneyTitleDraft('');

    setEditingJourneyTitle(false);
  }

  async function saveJourneyTitle() {
    if (!activeSession || !workspaceId) {
      return;
    }

    const title = journeyTitleDraft.replace(/\s+/g, ' ').trim();

    if (!title) {
      setError('A Journey name cannot be empty.');

      return;
    }

    if (title.length > 120) {
      setError('Journey names are limited to 120 characters.');

      return;
    }

    setLoading(true);

    setError(null);

    try {
      const response = await fetch(
        `/api/assistant/sessions/${encodeURIComponent(activeSession.id)}?${queryString({
          audience,
          workspaceId,
          vendorProfileId
        })}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title
          })
        }
      );

      const data = await readJson<{
        session: AIAssistantSessionView;
      }>(response);

      setActiveSession(data.session);

      updateSessionSummary(data.session);

      setJourneyTitleDraft('');

      setEditingJourneyTitle(false);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The Journey name could not be saved.');
    } finally {
      setLoading(false);
    }
  }

  function deleteActiveJourney() {
    if (!activeSession || deletingJourneyId || clearingJourneyBucket) {
      return;
    }

    setJourneyDeleteRequest({
      mode: 'single',
      sessionId: activeSession.id,
      title: activeSession.journeyState?.objective ?? activeSession.journeyGoal ?? activeSession.title
    });
  }
  async function archiveSession() {
    if (!activeSession || !workspaceId) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `/api/assistant/sessions/${encodeURIComponent(activeSession.id)}?${queryString({
          audience,
          workspaceId,
          vendorProfileId
        })}`,
        {
          method: 'DELETE'
        }
      );

      await readJson<{
        archived: boolean;
      }>(response);

      setSessions(current => current.filter(item => item.id !== activeSession.id));

      setActiveSession(null);

      clearRememberedJourney();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The session could not be archived.');
    } finally {
      setLoading(false);
    }
  }

  async function restorePlan(messageId: string) {
    if (!activeSession || !workspaceId) {
      return;
    }

    setLoading(true);

    setError(null);

    try {
      const response = await fetch(
        `/api/assistant/sessions/${encodeURIComponent(activeSession.id)}/restore?${queryString({
          audience,
          workspaceId,
          vendorProfileId
        })}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            messageId
          })
        }
      );

      const data = await readJson<{
        session: AIAssistantSessionView;
      }>(response);

      setActiveSession(data.session);

      updateSessionSummary(data.session);

      rememberActiveJourney(data.session.id);

      window.dispatchEvent(
        new CustomEvent('rcentz:ai-intelligence-updated', {
          detail: {
            sessionId: data.session.id,
            activePlanMessageId: data.session.activePlanMessageId,
            action: 'PLAN_RESTORED'
          }
        })
      );
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : 'The selected plan could not be restored.';

      setError(message);

      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }

  async function deleteJourneyFromBucket(sessionId: string, title: string) {
    if (deletingJourneyId || clearingJourneyBucket || !workspaceId) {
      return;
    }

    setJourneyDeleteRequest({
      mode: 'single',
      sessionId,
      title
    });
  }
  async function clearJourneyBucket() {
    if (clearingJourneyBucket || deletingJourneyId || !workspaceId || !sessions.length) {
      return;
    }

    setJourneyDeleteRequest({
      mode: 'all',
      count: sessions.length
    });
  }
  async function confirmJourneyDeletion() {
    if (!journeyDeleteRequest || !workspaceId || deletingJourneyId || clearingJourneyBucket) {
      return;
    }

    if (journeyDeleteRequest.mode === 'all') {
      setClearingJourneyBucket(true);

      setError(null);

      try {
        for (const session of sessions) {
          const response = await fetch(
            `/api/assistant/sessions/${encodeURIComponent(session.id)}?${queryString({
              audience,
              workspaceId,
              vendorProfileId
            })}&mode=delete`,
            {
              method: 'DELETE'
            }
          );

          await readJson<{
            deleted: boolean;
          }>(response);
        }

        if (activeSession) {
          window.localStorage.removeItem(promptDraftStorageKey);
        }

        clearRememberedJourney();

        setSessions([]);

        setActiveSession(null);

        setPrompt('');

        setEditingJourneyTitle(false);

        setJourneyDeleteRequest(null);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : 'The Journey bucket could not be cleared.');

        await loadSessions();
      } finally {
        setClearingJourneyBucket(false);
      }

      return;
    }

    const { sessionId } = journeyDeleteRequest;

    setDeletingJourneyId(sessionId);

    setError(null);

    try {
      const response = await fetch(
        `/api/assistant/sessions/${encodeURIComponent(sessionId)}?${queryString({
          audience,
          workspaceId,
          vendorProfileId
        })}&mode=delete`,
        {
          method: 'DELETE'
        }
      );

      await readJson<{
        deleted: boolean;
      }>(response);

      const deletingActive = sessionId === activeSession?.id;

      setSessions(current => current.filter(session => session.id !== sessionId));

      if (deletingActive) {
        window.localStorage.removeItem(promptDraftStorageKey);

        clearRememberedJourney();

        setActiveSession(null);

        setPrompt('');

        setEditingJourneyTitle(false);
      }

      setJourneyDeleteRequest(null);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'The Journey could not be deleted.');

      await loadSessions();
    } finally {
      setDeletingJourneyId(null);
    }
  }

  function requestJourneyCompletion() {
    if (
      !activeSession ||
      sending ||
      loading
    ) {
      return;
    }

    const unresolved = [
      ...(
        activeSession
          .journeyState
          ?.unresolvedQuestions ??
        []
      )
    ];

    const hasPlan =
      Boolean(
        activeSession
          .activePlanMessageId
      );

    const hasDecision =
      Boolean(
        activeSession
          .journeyState
          ?.confirmedDecisions
          .length
      ) ||
      activeSession
        .journeyLastTransition
        ?.reason ===
        'DECISION_CONFIRMED';

    if (
      !hasPlan
    ) {
      unresolved.unshift(
        'A complete plan has not been created yet.'
      );
    }

    if (
      hasPlan &&
      !hasDecision
    ) {
      unresolved.push(
        'The current plan has not been accepted yet.'
      );
    }

    setJourneyCompletionRequest({
      mode:
        hasPlan &&
        hasDecision &&
        !unresolved.length
          ? 'complete'
          : 'draft',
      unresolved: [
        ...new Set(
          unresolved
            .map(
              item =>
                item.trim()
            )
            .filter(
              Boolean
            )
        )
      ]
    });
  }

  async function confirmJourneyCompletion() {
    const request =
      journeyCompletionRequest;

    if (
      !request ||
      !activeSession ||
      sending ||
      loading
    ) {
      return;
    }

    setJourneyCompletionRequest(
      null
    );

    if (
      request.mode ===
      'draft'
    ) {
      startNewJourney();
      return;
    }

    await submitJourneyInput(
      'Complete this Journey.',
      'typed'
    );
  }

  async function reopenJourney() {
    if (
      !activeSession ||
      sending ||
      loading
    ) {
      return;
    }

    setJourneyReasoningOpen(
      false
    );

    await submitJourneyInput(
      'Reopen this Journey.',
      'typed'
    );
  }

  function toggleJourneyReasoning() {
    const opening =
      !journeyReasoningOpen;

    setJourneyReasoningOpen(
      opening
    );

    if (
      opening
    ) {
      window.setTimeout(
        () =>
          document
            .getElementById(
              'aj-journey-reasoning'
            )
            ?.scrollIntoView({
              behavior:
                'smooth',
              block:
                'start'
            }),
        0
      );
    }
  }

  function applicationApplied(messageId: string, application: AIAssistantApplicationView) {
    setActiveSession(current =>
      current
        ? {
            ...current,
            messages: current.messages.map(message =>
              message.id === messageId
                ? {
                    ...message,
                    feedback: 'APPLIED',
                    applications: [
                      application,
                      ...message.applications.filter(item => item.id !== application.id)
                    ]
                  }
                : message
            )
          }
        : current
    );
  }

  async function feedback(messageId: string, feedbackValue: AIAssistantFeedbackValue) {
    if (!workspaceId || !activeSession) {
      return;
    }

    try {
      const response = await fetch(`/api/assistant/messages/${encodeURIComponent(messageId)}/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audience,
          workspaceId,
          vendorProfileId,
          feedback: feedbackValue
        })
      });

      await readJson<{
        messageId: string;
        feedback: AIAssistantFeedbackValue;
      }>(response);

      setActiveSession(current =>
        current
          ? {
              ...current,
              messages: current.messages.map(message =>
                message.id === messageId
                  ? {
                      ...message,
                      feedback: feedbackValue
                    }
                  : message
              )
            }
          : current
      );

      window.dispatchEvent(
        new CustomEvent('rcentz:ai-intelligence-updated', {
          detail: {
            messageId,
            feedback: feedbackValue
          }
        })
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Feedback could not be recorded.');
    }
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();

      void submitJourneyInput(prompt, 'typed');
    }
  }
  const activePlanVersion =
    activeSession?.messages.find(message => message.id === activeSession.activePlanMessageId)
      ?.journeyVersion ??
    activeSession?.currentPlanVersion ??
    0;

  const savedPlanCount = activeSession?.messages.filter(message => message.isPlanSnapshot).length ?? 0;

  const pendingJourneyQuestion = activeSession?.journeyState?.unresolvedQuestions[0] ?? null;

  const budgetGuidance = resolveJourneyBudgetGuidance(activeSession);

  const quickPrompts = resolveAssistantSuggestedPrompts({
    audience,
    context: {
      workspaceId,
      vendorProfileId,
      productId: initialContext.productId ?? null,
      category: initialContext.category ?? null,
      intent: initialContext.intent ?? null,
      mode: initialContext.mode ?? null
    }
  });

  const activePlanMessage =
    activeSession?.messages.find(
      message =>
        message.id ===
        activeSession.activePlanMessageId
    ) ??
    null;

  const activePlanPrompts =
    activePlanMessage?.payload
      ?.suggestedPrompts ??
    [];

  const journeySuggestions =
    activePlanPrompts.length
      ? activePlanPrompts
          .slice(
            0,
            4
          )
          .map(
            (
              value,
              index
            ) => ({
              id:
                `plan-${activePlanMessage?.id ?? 'current'}-${index}`,
              label:
                value,
              prompt:
                value
            })
          )
      : quickPrompts
          .slice(
            0,
            4
          )
          .map(
            suggestion => ({
              id:
                suggestion.id,
              label:
                suggestion.label,
              prompt:
                suggestion.prompt
            })
          );

  const activeActivityStage = ASSISTANT_ACTIVITY_STAGES[activityStageIndex] ?? ASSISTANT_ACTIVITY_STAGES[0];

  if (audience === 'customer' && (identityPending || workspaceLoading)) {
    return (
      <main className="grid min-h-[75vh] place-items-center">
        <LoaderCircle className="size-8 animate-spin text-primary" />
      </main>
    );
  }

  if (audience === 'customer' && !isAuthenticated) {
    return (
      <main className="grid min-h-[75vh] place-items-center px-4">
        <section className="max-w-lg rounded-[2rem] border bg-card p-8 text-center shadow-xl">
          <BrainCircuit className="mx-auto size-10 text-primary" />

          <h1 className="mt-5 text-3xl font-semibold">Sign in to ask AJ</h1>

          <p className="mt-3 text-sm leading-6 text-muted-foreground">
            Recommendations, comparisons and Shopping List plans use your active workspace and privacy
            settings.
          </p>

          <Link
            href="/sign-in?next=/ai"
            className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground">
            Continue to sign in
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--accent)_14%,transparent),transparent_38%)] px-3 py-4 sm:px-5 sm:py-6">
      <div className="mx-auto max-w-[100rem] space-y-5">
        <header className="overflow-hidden rounded-[2rem] border border-accent/20 bg-gradient-premium p-5 text-white shadow-xl sm:p-7">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-4xl">
              <div className="flex flex-wrap items-center gap-3">
                <span className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/10 text-accent">
                  <BrainCircuit className="size-5" />
                </span>

                <div>
                  <p className="text-xs font-semibold uppercase text-accent">{profile.eyebrow}</p>

                  <p className="mt-1 text-xs text-white/45">{contextLabel}</p>
                </div>
              </div>

              <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">{profile.title}</h1>

              <p className="mt-4 max-w-3xl text-base leading-7 text-white/70">{profile.description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-2 text-xs font-semibold text-white/75">
                <LockKeyhole className="size-4" />
                You stay in control
              </span>
            </div>
          </div>
        </header>

        {error ? (
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        <section
          className={`grid min-h-[44rem] gap-5 ${
            sidebarOpen ? 'xl:grid-cols-[17.5rem_minmax(0,1fr)]' : 'grid-cols-1'
          }`}>
          {sidebarOpen ? (
            <JourneyNavigationRail
              sessions={sessions}
              activeSessionId={activeSession?.id ?? null}
              loading={loading}
              onSelect={sessionId => void selectSession(sessionId)}
              deletingJourneyId={deletingJourneyId}
              clearingJourneyBucket={clearingJourneyBucket}
              onDelete={(sessionId, title) => void deleteJourneyFromBucket(sessionId, title)}
              onClearAll={() => void clearJourneyBucket()}
              onStartNew={startNewJourney}
              onClose={() => setSidebarOpen(false)}
            />
          ) : null}

          <div className="min-w-0 overflow-hidden rounded-[2rem] border border-border/60 bg-card/80 shadow-sm">
            <header className="flex min-w-0 items-center justify-between gap-3 border-b border-border/60 px-4 py-3 sm:px-5">
              <div className="flex min-w-0 items-center gap-3">
                {!sidebarOpen ? (
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="grid size-9 shrink-0 place-items-center rounded-full border"
                    aria-label="Show journey list">
                    <PanelLeftOpen className="size-4" />
                  </button>
                ) : null}

                <span className="grid size-9 shrink-0 place-items-center rounded-2xl bg-accent/12 text-accent">
                  <Bot className="size-4" />
                </span>

                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{activeSession?.title ?? 'New journey'}</p>

                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {activeSession
                      ? activePlanVersion > 0
                        ? `Plan v${activePlanVersion} · ${
                            activeSession.lastRefinedAt
                              ? `refined ${new Date(activeSession.lastRefinedAt).toLocaleString('en-NG')}`
                              : 'saved Journey'
                          }`
                        : `Gathering details · State v${activeSession.journeyStateVersion}`
                      : 'Living planning and decision workspace'}
                  </p>
                </div>
              </div>

              {activeSession ? (
                <button
                  type="button"
                  onClick={() => void archiveSession()}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-full border px-3 text-xs font-semibold">
                  <Archive className="size-3.5" />
                  Archive
                </button>
              ) : null}
            </header>
            {activeSession ? (
              <JourneyProgressStrip
                stage={activeSession.journeyStage}
                planVersion={activePlanVersion}
                stateVersion={activeSession.journeyStateVersion}
              />
            ) : null}

            {activeSession ? (
              <JourneySummaryCard
                session={activeSession}
                activePlanMessage={activePlanMessage}
                planVersion={activePlanVersion}
                savedPlanCount={savedPlanCount}
                busy={sending || loading}
                reasoningOpen={journeyReasoningOpen}
                onComplete={requestJourneyCompletion}
                onReopen={() => void reopenJourney()}
                onToggleReasoning={toggleJourneyReasoning}
              />
            ) : null}

            <section className="border-b border-border/60 bg-background/55 px-5 py-4 sm:px-6">
              {activeSession ? (
                <div className="flex flex-col gap-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      {editingJourneyTitle ? (
                        <div className="flex min-w-0 items-center gap-2">
                          <input
                            autoFocus
                            value={journeyTitleDraft}
                            maxLength={120}
                            onChange={event => setJourneyTitleDraft(event.target.value)}
                            onKeyDown={event => {
                              if (event.key === 'Enter') {
                                event.preventDefault();

                                void saveJourneyTitle();
                              }

                              if (event.key === 'Escape') {
                                cancelJourneyTitleEdit();
                              }
                            }}
                            className="h-10 min-w-0 flex-1 rounded-xl border border-accent/35 bg-background px-3 text-sm font-semibold outline-none ring-accent/20 focus:ring-2"
                            aria-label="Journey name"
                          />

                          <button
                            type="button"
                            onClick={() => void saveJourneyTitle()}
                            className="grid size-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground"
                            aria-label="Save Journey name"
                            title="Save Journey name">
                            <Save className="size-4" />
                          </button>

                          <button
                            type="button"
                            onClick={cancelJourneyTitleEdit}
                            className="grid size-10 shrink-0 place-items-center rounded-full border"
                            aria-label="Cancel Journey name editing"
                            title="Cancel">
                            <X className="size-4" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <p className="text-[11px] font-semibold uppercase text-accent">Active Journey</p>

                          <p className="mt-1 truncate text-sm font-semibold">{activeSession.title}</p>
                        </>
                      )}
                    </div>

                    {!editingJourneyTitle ? (
                      <div className="flex flex-wrap items-center gap-1.5">
                        <button
                          type="button"
                          disabled={loading}
                          onClick={beginJourneyTitleEdit}
                          className="inline-flex h-9 items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 text-xs font-semibold transition hover:border-accent/35 hover:bg-accent/10 disabled:opacity-45">
                          <Pencil className="size-3.5" />
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => void archiveSession()}
                          className="inline-flex h-9 items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 text-xs font-semibold transition hover:bg-muted disabled:opacity-45">
                          <Archive className="size-3.5" />
                          Archive
                        </button>

                        <button
                          type="button"
                          disabled={loading}
                          onClick={() => void deleteActiveJourney()}
                          className="inline-flex h-9 items-center gap-2 rounded-full border border-destructive/25 bg-destructive/5 px-3 text-xs font-semibold text-destructive transition hover:border-destructive/45 hover:bg-destructive/10 disabled:opacity-45">
                          <Trash2 className="size-3.5" />
                          Delete
                        </button>
                      </div>
                    ) : null}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold uppercase text-muted-foreground">
                    <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                      <Database className="size-3.5" />
                      Saved to this Journey
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <CheckCircle2 className="size-3.5 text-accent" />

                      {activePlanVersion > 0 ? `Current plan v${activePlanVersion}` : 'Plan not created yet'}
                    </span>

                    <span>Stage {journeyStageLabel(activeSession.journeyStage)}</span>

                    <span>State v{activeSession.journeyStateVersion}</span>

                    <span>
                      {savedPlanCount} saved version{savedPlanCount === 1 ? '' : 's'}
                    </span>

                    <span>Draft auto-saved locally</span>
                  </div>
                </div>
              ) : (
                <div className="text-[11px] font-semibold uppercase text-muted-foreground">
                  New Journey · saved after AJ prepares the first plan · draft auto-saved locally
                </div>
              )}
            </section>

            <div className="flex min-h-[38rem] flex-col">
              {/* AJ_MS12_UNIFIED_TOP_JOURNEY_INPUT_V3 */}
              {activeSession?.journeyStage === 'COMPLETED' ? null : pendingJourneyQuestion ? (
                <footer className="border-b border-border/60 bg-background/75 p-4 backdrop-blur sm:p-5">
                  <JourneyClarificationCard
                    question={pendingJourneyQuestion}
                    sending={sending}
                    suggestions={budgetGuidance?.options}
                    suggestionContext={budgetGuidance?.context ?? null}
                    onSubmit={value => {
                      void submitJourneyInput(value, 'typed');
                    }}
                  />
                </footer>
              ) : (
                <footer className="border-b border-border/60 bg-background/75 p-4 backdrop-blur sm:p-5">
                  {/* <div className="flex items-start text-muted-foreground p-4">
                    <p className="text-xs">
                      Shelsea can prepare drafts and suggestions. You stay in control of publishing, stock,
                      Orders and payments.
                    </p>
                  </div> */}
                  <div className="flex min-w-0 items-end gap-3 rounded-[1.5rem] border border-border/70 bg-card p-3 shadow-sm focus-within:border-accent/40">
                    <textarea
                      id="aj-unified-journey-input"
                      value={prompt}
                      onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setPrompt(event.target.value)}
                      onKeyDown={onKeyDown}
                      rows={2}
                      maxLength={2000}
                      placeholder={
                        audience === 'customer'
                          ? 'Tell me what you are shopping for, planning or trying to decide…'
                          : audience === 'vendor'
                            ? 'Tell me what you want to create, improve or prepare…'
                            : 'Tell me what needs attention, review or preparation…'
                      }
                      className="min-h-14 min-w-0 flex-1 resize-none bg-transparent px-3 py-2.5 text-base leading-7 outline-none"
                    />

                    <button
                      type="button"
                      disabled={sending || !prompt.trim() || !workspaceId}
                      onClick={() => void submitJourneyInput(prompt, 'typed')}
                      className="grid size-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition disabled:opacity-40"
                      aria-label="Send request to AJ">
                      {sending ? (
                        <LoaderCircle className="size-4 animate-spin" />
                      ) : (
                        <Send className="size-4" />
                      )}
                    </button>
                  </div>
                  {/* AJ_MS12_UNIFIED_JOURNEY_SUGGESTION_RAIL_V2 */}
                  {journeySuggestions.length ? (
                    <section
                      className="mt-3 border-t border-border/55 pt-3"
                      aria-label="Journey suggestions">
                      <div>
                        <p className="text-xs font-semibold text-accent">
                          Continue this Journey
                        </p>

                        <p className="mt-1 text-xs leading-5 text-muted-foreground">
                          Choose a suggestion to apply it as the next direction in this Journey.
                        </p>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {journeySuggestions.map(
                          suggestion => (
                            <button
                              key={
                                suggestion.id
                              }
                              type="button"
                              disabled={
                                sending
                              }
                              onClick={() => {
                                setError(
                                  null
                                );

                                void submitJourneyInput(
                                  suggestion.prompt,
                                  'suggested'
                                );
                              }}
                              className="rounded-full border border-accent/25 bg-accent/8 px-3 py-2 text-xs font-semibold transition hover:border-accent/45 hover:bg-accent/15 disabled:cursor-not-allowed disabled:opacity-45">
                              {
                                suggestion.label
                              }
                            </button>
                          )
                        )}
                      </div>
                    </section>
                  ) : null}
                </footer>
              )}

              <IntelligenceWorkspace
                audience={audience}
                workspaceId={workspaceId}
                vendorProfileId={vendorProfileId}
                sessionId={activeSession?.id ?? null}
                runtime={initialContext}
                conversation={
                  <>
                    <GuidedAssistantExperience
                      audience={audience}
                      workspaceId={workspaceId}
                      vendorProfileId={vendorProfileId}
                      session={activeSession}
                      prompts={quickPrompts}
                      sending={sending}
                      activityLabel={activeActivityStage.label}
                      reasoningOpen={journeyReasoningOpen}
                      onReasoningOpenChange={setJourneyReasoningOpen}
                      onPrompt={value => void submitJourneyInput(value, 'suggested')}
                      onEditPrompt={value => {
                        setPrompt(value);
                        setError(null);
                      }}
                      onClearPrompt={() => setPrompt('')}
                      onStartFresh={startNewJourney}
                      onRestorePlan={messageId => restorePlan(messageId)}
                      onApplied={applicationApplied}
                      onFeedback={(messageId, feedbackValue) => void feedback(messageId, feedbackValue)}
                    />
                  </>
                }
              />
            </div>
          </div>
        </section>
      </div>
      <JourneyCompletionDialog
        open={Boolean(journeyCompletionRequest)}
        mode={journeyCompletionRequest?.mode ?? 'draft'}
        title={activeSession?.journeyState?.objective ?? activeSession?.journeyGoal ?? activeSession?.title ?? null}
        unresolved={journeyCompletionRequest?.unresolved ?? []}
        busy={sending || loading}
        onCancel={() => setJourneyCompletionRequest(null)}
        onConfirm={() => void confirmJourneyCompletion()}
      />
      <JourneyDeleteDialog
        open={Boolean(journeyDeleteRequest)}
        mode={journeyDeleteRequest?.mode ?? 'single'}
        title={journeyDeleteRequest?.mode === 'single' ? journeyDeleteRequest.title : null}
        count={journeyDeleteRequest?.mode === 'all' ? journeyDeleteRequest.count : 0}
        busy={clearingJourneyBucket || Boolean(deletingJourneyId)}
        onCancel={() => setJourneyDeleteRequest(null)}
        onConfirm={() => void confirmJourneyDeletion()}
      />
    </main>
  );
}
