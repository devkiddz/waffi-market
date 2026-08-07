'use client';

import {
  Archive,
  ArrowLeft,
  BookOpenCheck,
  BrainCircuit,
  CheckCircle2,
  FilePenLine,
  LoaderCircle,
  MessageCircleWarning,
  Plus,
  RefreshCw,
  Save,
  Search,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  X
} from 'lucide-react';
import Link from 'next/link';
import {
  useMemo,
  useState,
  useTransition
} from 'react';

import { cn } from '@/lib/utils';

import { SUPPORT_GUIDE_INTENTS } from '../supportGuideTypes';
import type { SupportGuideIntent } from '../supportGuideTypes';
import { SUPPORT_KNOWLEDGE_STATUSES } from '../supportKnowledgeTypes';
import type {
  SupportKnowledgeLearningCandidate,
  SupportKnowledgeMutation,
  SupportKnowledgeStudioEntry,
  SupportKnowledgeStudioSnapshot
} from '../supportKnowledgeManagementTypes';

type StudioTab = 'KNOWLEDGE' | 'LEARNING' | 'INTERACTIONS';

type FormState = {
  id: string | null;
  bucketId: string;
  slug: string;
  title: string;
  category: string;
  intent: SupportGuideIntent;
  primaryQuestion: string;
  answerTemplate: string;
  clarificationAnswer: string;
  escalationAnswer: string;
  keywords: string;
  synonyms: string;
  requiredContext: string;
  priority: string;
  confidenceThreshold: string;
  examples: string;
  conditions: string;
  actions: string;
};

const dateFormatter = new Intl.DateTimeFormat('en-NG', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

function emptyForm(bucketId: string): FormState {
  return {
    id: null,
    bucketId,
    slug: '',
    title: '',
    category: 'GENERAL',
    intent: 'UNKNOWN',
    primaryQuestion: '',
    answerTemplate: '',
    clarificationAnswer: '',
    escalationAnswer: '',
    keywords: '',
    synonyms: '',
    requiredContext: '',
    priority: '0',
    confidenceThreshold: '0.65',
    examples: '',
    conditions: '',
    actions: '[]'
  };
}

function formFromEntry(entry: SupportKnowledgeStudioEntry): FormState {
  return {
    id: entry.id,
    bucketId: entry.bucketId ?? '',
    slug: entry.slug,
    title: entry.title,
    category: entry.category,
    intent: entry.intent,
    primaryQuestion: entry.primaryQuestion,
    answerTemplate: entry.answerTemplate,
    clarificationAnswer: entry.clarificationAnswer ?? '',
    escalationAnswer: entry.escalationAnswer ?? '',
    keywords: entry.keywords.join(', '),
    synonyms: entry.synonyms.join(', '),
    requiredContext: entry.requiredContext.join(', '),
    priority: String(entry.priority),
    confidenceThreshold: String(entry.confidenceThreshold),
    examples: entry.questionExamples.map(example => example.text).join('\n'),
    conditions: entry.conditions
      ? JSON.stringify(entry.conditions, null, 2)
      : '',
    actions: entry.actions ? JSON.stringify(entry.actions, null, 2) : '[]'
  };
}

function formFromCandidate(
  candidate: SupportKnowledgeLearningCandidate,
  bucketId: string
): FormState {
  return {
    ...emptyForm(bucketId),
    slug: candidate.suggestedSlug,
    title: candidate.suggestedTitle,
    category: candidate.suggestedCategory,
    intent: candidate.suggestedIntent,
    primaryQuestion: candidate.representativeQuestion,
    keywords: candidate.normalizedQuestion
      .split(' ')
      .filter(word => word.length > 2)
      .slice(0, 12)
      .join(', '),
    examples: candidate.sampleQuestions.join('\n')
  };
}

function parseJson(value: string, fallback: unknown, label: string): unknown {
  if (!value.trim()) return fallback;
  try {
    return JSON.parse(value) as unknown;
  } catch {
    throw new Error(`${label} contains invalid JSON.`);
  }
}

function mutationFromForm(
  form: FormState,
  status: SupportKnowledgeMutation['status']
): SupportKnowledgeMutation {
  const split = (value: string) =>
    value
      .split(/[\n,]+/)
      .map(item => item.trim())
      .filter(Boolean);

  return {
    bucketId: form.bucketId || null,
    slug: form.slug,
    title: form.title,
    category: form.category,
    intent: form.intent,
    primaryQuestion: form.primaryQuestion,
    answerTemplate: form.answerTemplate,
    clarificationAnswer: form.clarificationAnswer || null,
    escalationAnswer: form.escalationAnswer || null,
    keywords: split(form.keywords),
    synonyms: split(form.synonyms),
    requiredContext: split(form.requiredContext),
    conditions: parseJson(form.conditions, null, 'Conditions') as
      | Record<string, unknown>
      | null,
    actions: parseJson(form.actions, [], 'Actions') as Array<
      Record<string, unknown>
    >,
    status,
    priority: Number(form.priority),
    confidenceThreshold: Number(form.confidenceThreshold),
    examples: form.examples
      .split('\n')
      .map(item => item.trim())
      .filter(Boolean)
      .map(text => ({ text, locale: 'en-NG', weight: 1, active: true }))
  };
}

async function readFailure(response: Response, fallback: string) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? fallback;
  } catch {
    return fallback;
  }
}

export function SupportKnowledgeStudio({
  initialSnapshot,
  canConfigure
}: {
  initialSnapshot: SupportKnowledgeStudioSnapshot;
  canConfigure: boolean;
}) {
  const [snapshot, setSnapshot] = useState(initialSnapshot);
  const [tab, setTab] = useState<StudioTab>('KNOWLEDGE');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<
    'ALL' | SupportKnowledgeMutation['status']
  >('ALL');
  const [editorOpen, setEditorOpen] = useState(false);
  const [form, setForm] = useState(
    emptyForm(initialSnapshot.buckets[0]?.id ?? '')
  );
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const visibleEntries = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    return snapshot.entries.filter(entry => {
      if (statusFilter !== 'ALL' && entry.status !== statusFilter) {
        return false;
      }

      return (
        !normalized ||
        [
          entry.title,
          entry.slug,
          entry.category,
          entry.intent,
          entry.primaryQuestion,
          entry.answerTemplate,
          entry.keywords.join(' '),
          entry.synonyms.join(' ')
        ]
          .join(' ')
          .toLowerCase()
          .includes(normalized)
      );
    });
  }, [query, snapshot.entries, statusFilter]);

  const refresh = async () => {
    const response = await fetch('/api/admin/support/knowledge', {
      credentials: 'same-origin',
      cache: 'no-store'
    });

    if (!response.ok) {
      throw new Error(
        await readFailure(
          response,
          'Shelsea could not refresh the Knowledge Studio.'
        )
      );
    }

    setSnapshot((await response.json()) as SupportKnowledgeStudioSnapshot);
  };

  const refreshStudio = () => {
    startTransition(async () => {
      try {
        await refresh();
        setError(null);
        setNotice('Knowledge Studio refreshed.');
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Shelsea could not refresh the Knowledge Studio.'
        );
      }
    });
  };

  const openNew = () => {
    if (!canConfigure) return;
    setForm(emptyForm(snapshot.buckets[0]?.id ?? ''));
    setEditorOpen(true);
    setError(null);
  };

  const openEntry = (entry: SupportKnowledgeStudioEntry) => {
    if (!canConfigure) return;
    setForm(formFromEntry(entry));
    setEditorOpen(true);
    setError(null);
  };

  const openCandidate = (candidate: SupportKnowledgeLearningCandidate) => {
    if (!canConfigure) return;
    setForm(formFromCandidate(candidate, snapshot.buckets[0]?.id ?? ''));
    setTab('KNOWLEDGE');
    setEditorOpen(true);
    setNotice(
      'Learning evidence copied into a new draft. Write and verify the answer before saving or publishing.'
    );
  };

  const save = (status: SupportKnowledgeMutation['status']) => {
    startTransition(async () => {
      try {
        setError(null);
        const response = await fetch(
          form.id
            ? `/api/admin/support/knowledge/${encodeURIComponent(form.id)}`
            : '/api/admin/support/knowledge',
          {
            method: form.id ? 'PATCH' : 'POST',
            credentials: 'same-origin',
            cache: 'no-store',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(mutationFromForm(form, status))
          }
        );

        if (!response.ok) {
          throw new Error(
            await readFailure(response, 'Shelsea could not save Support Knowledge.')
          );
        }

        await refresh();
        setEditorOpen(false);
        setNotice(
          status === 'ACTIVE'
            ? 'Support Knowledge published.'
            : status === 'ARCHIVED'
              ? 'Support Knowledge archived.'
              : 'Support Knowledge saved as a draft.'
        );
      } catch (cause) {
        setError(
          cause instanceof Error
            ? cause.message
            : 'Shelsea could not save Support Knowledge.'
        );
      }
    });
  };

  return (
    <main className="min-h-dvh px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[100rem] space-y-5">
        <header className="rounded-[2rem] border border-border/60 bg-slate-950 p-5 text-white shadow-xl sm:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-violet-200">
                AJ Support Intelligence
              </p>
              <h1 className="mt-3 text-3xl font-black sm:text-5xl">
                Knowledge Studio
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-6 text-white/65">
                Govern approved answers, review weak interactions and turn recurring customer questions into human-verified knowledge. Runtime conversations never publish themselves.
              </p>
              <div className="mt-5 flex flex-wrap gap-2">
                <Link
                  href="/admin/support"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black text-slate-950">
                  <ArrowLeft className="size-3.5" />
                  Support queue
                </Link>
                <Link
                  href="/admin/support/analytics"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 px-4 py-2.5 text-xs font-black text-white">
                  Analytics & Audit
                </Link>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Metric label="Active" value={snapshot.metrics.activeEntries} />
              <Metric label="Drafts" value={snapshot.metrics.draftEntries} />
              <Metric label="No match" value={snapshot.metrics.noMatchInteractions} />
              <Metric label="Learning" value={snapshot.metrics.learningCandidates} />
            </div>
          </div>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Insight
            icon={<ThumbsUp className="size-4" />}
            label="Helpful feedback"
            value={snapshot.metrics.helpfulFeedback}
            detail={
              snapshot.metrics.helpfulRate === null
                ? 'No feedback yet'
                : `${Math.round(snapshot.metrics.helpfulRate * 100)}% helpful`
            }
          />
          <Insight
            icon={<ThumbsDown className="size-4" />}
            label="Unhelpful feedback"
            value={snapshot.metrics.unhelpfulFeedback}
            detail="Feeds governed review"
          />
          <Insight
            icon={<MessageCircleWarning className="size-4" />}
            label="Context required"
            value={snapshot.metrics.contextRequiredInteractions}
            detail="Requires verified data"
          />
          <Insight
            icon={<BrainCircuit className="size-4" />}
            label="Human requests"
            value={snapshot.metrics.humanRequestedInteractions}
            detail="Escalated from Intelligence"
          />
        </section>

        <section className="flex flex-col gap-3 rounded-[1.75rem] border border-border/60 bg-card/80 p-4 shadow-sm xl:flex-row xl:items-center">
          <div className="flex max-w-full gap-2 overflow-x-auto">
            <TabButton
              active={tab === 'KNOWLEDGE'}
              label="Knowledge"
              onClick={() => setTab('KNOWLEDGE')}
            />
            <TabButton
              active={tab === 'LEARNING'}
              label={`Learning (${snapshot.learningCandidates.length})`}
              onClick={() => setTab('LEARNING')}
            />
            <TabButton
              active={tab === 'INTERACTIONS'}
              label="Interactions"
              onClick={() => setTab('INTERACTIONS')}
            />
          </div>
          <span className="min-w-0 flex-1" />
          <button
            type="button"
            onClick={refreshStudio}
            disabled={isPending}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-full border border-border px-4 text-xs font-black disabled:opacity-50">
            <RefreshCw className={cn('size-3.5', isPending && 'animate-spin')} />
            Refresh
          </button>
          {canConfigure ? (
            <button
              type="button"
              onClick={openNew}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-primary px-4 text-xs font-black text-primary-foreground">
              <Plus className="size-3.5" />
              New knowledge
            </button>
          ) : (
            <span className="rounded-full border border-border px-4 py-2 text-[10px] font-black text-muted-foreground">
              Read-only access
            </span>
          )}
        </section>

        {error ? (
          <div role="alert" className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-sm text-destructive">
            {error}
          </div>
        ) : null}
        {notice ? (
          <div role="status" className="rounded-2xl border border-primary/20 bg-primary/[0.07] p-4 text-sm text-primary">
            {notice}
          </div>
        ) : null}

        {tab === 'KNOWLEDGE' ? (
          <section className="space-y-4">
            <div className="flex flex-col gap-3 rounded-[1.5rem] border border-border/60 bg-card/70 p-4 lg:flex-row lg:items-center">
              <label className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Search title, question, answer, intent or keyword"
                  className="h-11 w-full rounded-full border border-border bg-background pl-10 pr-4 text-sm"
                />
              </label>
              <div className="flex max-w-full gap-2 overflow-x-auto">
                <FilterButton
                  active={statusFilter === 'ALL'}
                  label="All"
                  onClick={() => setStatusFilter('ALL')}
                />
                {SUPPORT_KNOWLEDGE_STATUSES.map(status => (
                  <FilterButton
                    key={status}
                    active={statusFilter === status}
                    label={status}
                    onClick={() => setStatusFilter(status)}
                  />
                ))}
              </div>
            </div>

            <div className="grid gap-3">
              {visibleEntries.map(entry => (
                <button
                  key={entry.id}
                  type="button"
                  disabled={!canConfigure}
                  onClick={() => openEntry(entry)}
                  className="flex w-full items-start gap-4 rounded-[1.5rem] border border-border/60 bg-card/75 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-primary/25 disabled:cursor-default disabled:hover:translate-y-0 sm:p-5">
                  <span
                    className={cn(
                      'grid size-11 shrink-0 place-items-center rounded-2xl',
                      entry.status === 'ACTIVE'
                        ? 'bg-emerald-500/12 text-emerald-600'
                        : entry.status === 'ARCHIVED'
                          ? 'bg-muted text-muted-foreground'
                          : 'bg-amber-500/12 text-amber-700'
                    )}>
                    {entry.status === 'ACTIVE' ? (
                      <CheckCircle2 className="size-4" />
                    ) : entry.status === 'ARCHIVED' ? (
                      <Archive className="size-4" />
                    ) : (
                      <FilePenLine className="size-4" />
                    )}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm sm:text-base">{entry.title}</strong>
                      <Badge>{entry.status}</Badge>
                      <Badge>{entry.intent}</Badge>
                      <Badge>v{entry.version}</Badge>
                    </span>
                    <span className="mt-2 block text-xs font-bold">
                      {entry.primaryQuestion}
                    </span>
                    <span className="mt-1 line-clamp-2 block text-xs leading-5 text-muted-foreground">
                      {entry.answerTemplate}
                    </span>
                    <span className="mt-3 flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                      <span>{entry.questionExamples.length} examples</span>
                      <span>{entry.performance.interactions} interactions</span>
                      <span>{entry.performance.helpful} helpful</span>
                      <span>{entry.performance.unhelpful} unhelpful</span>
                      <span>
                        Updated {dateFormatter.format(new Date(entry.updatedAt))}
                      </span>
                    </span>
                  </span>
                </button>
              ))}
              {!visibleEntries.length ? (
                <EmptyState
                  title="No matching knowledge"
                  detail="Create a governed answer or adjust the filters."
                />
              ) : null}
            </div>
          </section>
        ) : null}

        {tab === 'LEARNING' ? (
          <section className="grid gap-3">
            <div className="rounded-[1.5rem] border border-violet-500/20 bg-violet-500/[0.06] p-4 text-sm leading-6">
              <strong>Learning is advisory.</strong> Candidates group unresolved, human-handoff and unhelpful interactions. Preparing one only opens an unsaved draft.
            </div>
            {snapshot.learningCandidates.map(candidate => (
              <article
                key={candidate.id}
                className="rounded-[1.5rem] border border-border/60 bg-card/75 p-4 shadow-sm sm:p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                  <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-violet-500/10 text-violet-600">
                    <Sparkles className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <strong className="text-sm sm:text-base">
                        {candidate.representativeQuestion}
                      </strong>
                      <Badge>Score {candidate.reviewScore}</Badge>
                      <Badge>{candidate.occurrences} occurrences</Badge>
                    </div>
                    <p className="mt-2 text-xs leading-5 text-muted-foreground">
                      {candidate.reviewReason}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {candidate.sampleQuestions.map(question => (
                        <span
                          key={question}
                          className="rounded-full border border-border/70 bg-background px-3 py-1.5 text-[10px]">
                          {question}
                        </span>
                      ))}
                    </div>
                    <p className="mt-3 text-[10px] text-muted-foreground">
                      Suggested {candidate.suggestedIntent} · {candidate.suggestedCategory} · Last seen {dateFormatter.format(new Date(candidate.lastSeenAt))}
                    </p>
                  </div>
                  {canConfigure ? (
                    <button
                      type="button"
                      onClick={() => openCandidate(candidate)}
                      className="inline-flex shrink-0 items-center justify-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground">
                      <FilePenLine className="size-3.5" />
                      Prepare draft
                    </button>
                  ) : null}
                </div>
              </article>
            ))}
            {!snapshot.learningCandidates.length ? (
              <EmptyState
                title="No learning candidates"
                detail="No unresolved or unhelpful question clusters exist in the current review window."
              />
            ) : null}
          </section>
        ) : null}

        {tab === 'INTERACTIONS' ? (
          <section className="overflow-hidden rounded-[1.5rem] border border-border/60 bg-card/75">
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-xs">
                <thead className="border-b border-border/60 bg-muted/45 text-[9px] font-black uppercase tracking-[0.12em] text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Question</th>
                    <th className="px-4 py-3">Outcome</th>
                    <th className="px-4 py-3">Intent</th>
                    <th className="px-4 py-3">Feedback</th>
                    <th className="px-4 py-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {snapshot.recentInteractions.map(interaction => (
                    <tr key={interaction.id} className="align-top">
                      <td className="max-w-xl px-4 py-3">
                        <p className="font-bold">{interaction.question}</p>
                        {interaction.feedbackReason ? (
                          <p className="mt-1 text-[10px] text-muted-foreground">
                            {interaction.feedbackReason}
                          </p>
                        ) : null}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {interaction.outcome}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {interaction.matchedIntent ?? '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        {interaction.feedbackHelpful === true
                          ? 'Helpful'
                          : interaction.feedbackHelpful === false
                            ? 'Unhelpful'
                            : '—'}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-muted-foreground">
                        {dateFormatter.format(new Date(interaction.createdAt))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </div>

      {editorOpen ? (
        <div className="fixed inset-0 z-[100] flex justify-end bg-black/45 backdrop-blur-sm">
          <button
            type="button"
            aria-label="Close Knowledge editor"
            className="absolute inset-0"
            onClick={() => setEditorOpen(false)}
          />
          <aside className="relative flex h-dvh w-full max-w-3xl flex-col border-l border-border bg-background shadow-2xl">
            <header className="flex items-center gap-3 border-b border-border/60 p-4 sm:p-5">
              <span className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                <BookOpenCheck className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.14em] text-primary">
                  Governed knowledge
                </p>
                <h2 className="truncate text-lg font-black">
                  {form.id ? 'Edit Support Knowledge' : 'Prepare Support Knowledge'}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close editor"
                onClick={() => setEditorOpen(false)}
                className="grid size-9 place-items-center rounded-full border border-border">
                <X className="size-4" />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-4 sm:p-6">
              <Grid>
                <Field label="Title" value={form.title} onChange={value => setForm(current => ({ ...current, title: value }))} />
                <Field label="Slug" value={form.slug} onChange={value => setForm(current => ({ ...current, slug: value }))} />
                <Field label="Category" value={form.category} onChange={value => setForm(current => ({ ...current, category: value }))} />
                <SelectField
                  label="Intent"
                  value={form.intent}
                  options={SUPPORT_GUIDE_INTENTS}
                  onChange={value => setForm(current => ({ ...current, intent: value as SupportGuideIntent }))}
                />
                <SelectField
                  label="Bucket"
                  value={form.bucketId}
                  options={snapshot.buckets.map(bucket => bucket.id)}
                  labels={Object.fromEntries(snapshot.buckets.map(bucket => [bucket.id, bucket.name]))}
                  onChange={value => setForm(current => ({ ...current, bucketId: value }))}
                />
                <Field label="Priority" type="number" value={form.priority} onChange={value => setForm(current => ({ ...current, priority: value }))} />
                <Field label="Confidence threshold" type="number" step="0.05" value={form.confidenceThreshold} onChange={value => setForm(current => ({ ...current, confidenceThreshold: value }))} />
              </Grid>

              <TextArea label="Primary question" rows={2} value={form.primaryQuestion} onChange={value => setForm(current => ({ ...current, primaryQuestion: value }))} />
              <TextArea label="Approved answer" rows={7} value={form.answerTemplate} onChange={value => setForm(current => ({ ...current, answerTemplate: value }))} />
              <TextArea label="Clarification answer" rows={3} value={form.clarificationAnswer} onChange={value => setForm(current => ({ ...current, clarificationAnswer: value }))} />
              <TextArea label="Escalation answer" rows={3} value={form.escalationAnswer} onChange={value => setForm(current => ({ ...current, escalationAnswer: value }))} />
              <Grid>
                <TextArea label="Keywords" hint="Comma or line separated" rows={4} value={form.keywords} onChange={value => setForm(current => ({ ...current, keywords: value }))} />
                <TextArea label="Synonyms" hint="Comma or line separated" rows={4} value={form.synonyms} onChange={value => setForm(current => ({ ...current, synonyms: value }))} />
              </Grid>
              <TextArea label="Question examples" hint="One approved example per line" rows={7} value={form.examples} onChange={value => setForm(current => ({ ...current, examples: value }))} />
              <TextArea label="Required context" hint="Comma or line separated" rows={3} value={form.requiredContext} onChange={value => setForm(current => ({ ...current, requiredContext: value }))} />
              <Grid>
                <TextArea label="Conditions JSON" rows={6} value={form.conditions} onChange={value => setForm(current => ({ ...current, conditions: value }))} />
                <TextArea label="Actions JSON" rows={6} value={form.actions} onChange={value => setForm(current => ({ ...current, actions: value }))} />
              </Grid>
            </div>

            <footer className="flex flex-wrap items-center gap-2 border-t border-border/60 bg-card/85 p-4 backdrop-blur-xl sm:p-5">
              <button
                type="button"
                disabled={isPending}
                onClick={() => save('DRAFT')}
                className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2.5 text-xs font-black disabled:opacity-50">
                {isPending ? <LoaderCircle className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                Save draft
              </button>
              <button
                type="button"
                disabled={isPending}
                onClick={() => save('ACTIVE')}
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-black text-primary-foreground disabled:opacity-50">
                <CheckCircle2 className="size-3.5" />
                Publish
              </button>
              {form.id ? (
                <button
                  type="button"
                  disabled={isPending}
                  onClick={() => save('ARCHIVED')}
                  className="inline-flex items-center gap-2 rounded-full border border-destructive/25 px-4 py-2.5 text-xs font-black text-destructive disabled:opacity-50">
                  <Archive className="size-3.5" />
                  Archive
                </button>
              ) : null}
              <span className="ml-auto text-[10px] text-muted-foreground">
                Publish requires an approved answer and one example.
              </span>
            </footer>
          </aside>
        </div>
      ) : null}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
      <p className="text-[9px] font-black uppercase tracking-[0.16em] text-white/45">{label}</p>
      <p className="mt-1 text-2xl font-black">{value}</p>
    </div>
  );
}

function Insight({ icon, label, value, detail }: { icon: React.ReactNode; label: string; value: number; detail: string }) {
  return (
    <div className="rounded-[1.5rem] border border-border/60 bg-card/75 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid size-9 place-items-center rounded-2xl bg-primary/10 text-primary">{icon}</span>
        <div>
          <p className="text-[9px] font-black uppercase tracking-[0.13em] text-muted-foreground">{label}</p>
          <p className="mt-1 text-2xl font-black">{value}</p>
          <p className="mt-1 text-[10px] text-muted-foreground">{detail}</p>
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn('h-10 shrink-0 rounded-full px-4 text-[10px] font-black', active ? 'bg-foreground text-background' : 'border border-border bg-background text-muted-foreground')}>
      {label}
    </button>
  );
}

function FilterButton({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cn('h-9 shrink-0 rounded-full px-3 text-[10px] font-bold', active ? 'bg-foreground text-background' : 'border border-border bg-background text-muted-foreground')}>
      {label}
    </button>
  );
}

function Badge({ children }: { children: React.ReactNode }) {
  return <span className="rounded-full bg-muted px-2 py-1 text-[9px] font-black text-muted-foreground">{children}</span>;
}

function EmptyState({ title, detail }: { title: string; detail: string }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-[1.5rem] border border-dashed border-border/70 bg-card/45 p-8 text-center">
      <div>
        <BookOpenCheck className="mx-auto size-8 text-muted-foreground" />
        <h2 className="mt-4 text-base font-black">{title}</h2>
        <p className="mt-2 max-w-md text-xs leading-5 text-muted-foreground">{detail}</p>
      </div>
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 md:grid-cols-2">{children}</div>;
}

function Field({ label, value, onChange, type = 'text', step }: { label: string; value: string; onChange: (value: string) => void; type?: 'text' | 'number'; step?: string }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.11em] text-muted-foreground">{label}</span>
      <input type={type} step={step} value={value} onChange={event => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm" />
    </label>
  );
}

function SelectField({ label, value, options, labels, onChange }: { label: string; value: string; options: readonly string[]; labels?: Record<string, string>; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="text-[10px] font-black uppercase tracking-[0.11em] text-muted-foreground">{label}</span>
      <select value={value} onChange={event => onChange(event.target.value)} className="mt-2 h-11 w-full rounded-2xl border border-border bg-background px-3 text-sm">
        {options.map(option => <option key={option} value={option}>{labels?.[option] ?? option}</option>)}
      </select>
    </label>
  );
}

function TextArea({ label, hint, value, rows, onChange }: { label: string; hint?: string; value: string; rows: number; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="flex items-center justify-between gap-3">
        <span className="text-[10px] font-black uppercase tracking-[0.11em] text-muted-foreground">{label}</span>
        {hint ? <span className="text-[9px] text-muted-foreground">{hint}</span> : null}
      </span>
      <textarea rows={rows} value={value} onChange={event => onChange(event.target.value)} className="mt-2 w-full resize-y rounded-2xl border border-border bg-background px-3 py-2.5 text-sm leading-5" />
    </label>
  );
}
