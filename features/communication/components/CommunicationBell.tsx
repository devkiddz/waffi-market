'use client';

import {
  Bell,
  BellRing,
  Inbox,
  LoaderCircle,
  MessageCircle,
  PackageOpen,
  ShoppingBag
} from 'lucide-react';

import {
  useRouter
} from 'next/navigation';

import {
  useState
} from 'react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';

import {
  ShoppingActivityPanel
} from '@/components/shared/ShoppingActivityPanel';

import {
  useCart
} from '@/features/cart';

import {
  useNotificationSummary
} from '@/features/notifications';

import {
  useWishlist
} from '@/features/wishlist';

import {
  cn
} from '@/lib/utils';

import {
  useIdentity
} from '@/providers/IdentityProvider';

import type {
  CommunicationConversationSummary
} from '../communicationTypes';

import {
  useCommunicationSummary
} from '../client/useCommunicationSummary';

type BellView =
  | 'notifications'
  | 'inbox'
  | 'activity';

const dateFormatter =
  new Intl.DateTimeFormat(
    'en-NG',
    {
      dateStyle: 'medium',
      timeStyle: 'short'
    }
  );

function cappedCount(
  value: number
) {
  return value > 99
    ? '99+'
    : String(value);
}

function conversationTitle(
  conversation:
    CommunicationConversationSummary
) {
  return (
    conversation.subject ??
    conversation.vendor?.name ??
    'Shelsea conversation'
  );
}

function conversationPreview(
  conversation:
    CommunicationConversationSummary
) {
  if (
    conversation.lastMessage?.body
  ) {
    return conversation.lastMessage.body;
  }

  if (
    conversation.context?.orderNumber
  ) {
    return `Order ${conversation.context.orderNumber}`;
  }

  if (
    conversation.context?.productName
  ) {
    return conversation.context.productName;
  }

  return 'Conversation ready';
}

export function CommunicationBell() {
  const router = useRouter();

  const {
    isAuthenticated
  } = useIdentity();

  const [
    open,
    setOpen
  ] = useState(false);

  const [
    activeView,
    setActiveView
  ] = useState<BellView>(
    'notifications'
  );

  const notifications =
    useNotificationSummary(
      4,
      open
    );

  const communication =
    useCommunicationSummary(
      4,
      open
    );

  const {
    totalQuantity,
    loading: cartLoading
  } = useCart();

  const {
    count: wishlistCount,
    loading: wishlistLoading
  } = useWishlist();

  const activityCount =
    totalQuantity +
    wishlistCount;

  const combinedUnread =
    notifications.unreadCount +
    communication.unreadCount;

  const navigateTo = (
    href: string
  ) => {
    setOpen(false);
    router.push(href);
  };

  const openNotification = async (
    item: NonNullable<
      typeof notifications.snapshot
    >['items'][number]
  ) => {
    if (!item.readAt) {
      try {
        await notifications.mutate({
          action: 'mark-read',
          notificationId: item.id
        });
      } catch (cause) {
        console.error(
          'Notification read-state update failed.',
          cause
        );
      }
    }

    navigateTo(
      item.href ?? '/notifications'
    );
  };

  return (
    <DropdownMenu
      open={open}
      onOpenChange={setOpen}>
      <DropdownMenuTrigger
        aria-label={`Open updates. ${notifications.unreadCount} unread notifications and ${communication.unreadCount} unread messages.`}
        className="rounded-full outline-none">
        <div className="flex flex-col gap-1">
          <div className="relative flex size-9 shrink-0 items-center justify-center rounded-full bg-muted text-foreground transition hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring/50">
            <Bell className="size-4" />

            {combinedUnread > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex min-h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[9px] font-bold leading-4 text-accent-foreground shadow-sm">
                {cappedCount(
                  combinedUnread
                )}
              </span>
            ) : null}

            {communication.unreadCount >
            0 ? (
              <span className="absolute -bottom-1 -left-1 grid size-4 place-items-center rounded-full border-2 border-card bg-sky-500 text-white">
                <MessageCircle className="size-2.5" />
              </span>
            ) : null}
          </div>

          <span className="hidden text-xs md:inline">
            Updates
          </span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        sideOffset={12}
        className="w-[min(26rem,calc(100vw-1rem))] overflow-hidden rounded-3xl border border-border/60 bg-background/95 p-0 shadow-2xl backdrop-blur-2xl">
        <div className="border-b border-border/60 bg-card/70 px-4 pb-3 pt-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Communication centre
              </p>

              <h2 className="mt-1 text-base font-bold tracking-tight">
                Updates and activity
              </h2>
            </div>

            <div className="rounded-full border border-border/60 bg-background/70 px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">
              {combinedUnread
                ? `${cappedCount(
                    combinedUnread
                  )} unread`
                : 'Up to date'}
            </div>
          </div>

          <div className="mt-4 grid grid-cols-3 rounded-xl bg-muted/70 p-1">
            <BellTab
              active={
                activeView ===
                'notifications'
              }
              icon={
                <BellRing className="size-3.5" />
              }
              label="Notifications"
              count={
                notifications.unreadCount
              }
              onClick={() =>
                setActiveView(
                  'notifications'
                )
              }
            />

            <BellTab
              active={
                activeView ===
                'inbox'
              }
              icon={
                <Inbox className="size-3.5" />
              }
              label="Inbox"
              count={
                communication.unreadCount
              }
              onClick={() =>
                setActiveView('inbox')
              }
            />

            <BellTab
              active={
                activeView ===
                'activity'
              }
              icon={
                <ShoppingBag className="size-3.5" />
              }
              label="Activity"
              count={
                cartLoading ||
                wishlistLoading
                  ? null
                  : activityCount
              }
              onClick={() =>
                setActiveView(
                  'activity'
                )
              }
            />
          </div>
        </div>

        {activeView ===
        'notifications' ? (
          <NotificationPreview
            loading={
              notifications.loading
            }
            error={
              notifications.error
            }
            items={
              notifications.snapshot
                ?.items ?? []
            }
            onOpen={item =>
              void openNotification(
                item
              )
            }
            onOpenAll={() =>
              navigateTo(
                '/notifications'
              )
            }
          />
        ) : activeView ===
          'inbox' ? (
          <InboxPreview
            authenticated={
              isAuthenticated
            }
            loading={
              communication.loading
            }
            error={
              communication.error
            }
            conversations={
              communication.snapshot
                ?.conversations ?? []
            }
            onSignIn={() =>
              navigateTo('/sign-in')
            }
            onOpen={conversation =>
              navigateTo(
                `/inbox/${encodeURIComponent(
                  conversation.id
                )}`
              )
            }
            onOpenAll={() =>
              navigateTo('/inbox')
            }
          />
        ) : (
          <ShoppingActivityPanel
            onNavigate={() =>
              setOpen(false)
            }
          />
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function BellTab({
  active,
  icon,
  label,
  count,
  onClick
}: {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  count: number | null;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex min-w-0 items-center justify-center gap-1.5 rounded-lg px-2 py-2 text-[10px] font-semibold transition sm:text-xs',
        active
          ? 'bg-background text-foreground shadow-sm'
          : 'text-muted-foreground hover:text-foreground'
      )}>
      {icon}

      <span className="truncate">
        {label}
      </span>

      {count !== null &&
      count > 0 ? (
        <span className="rounded-full bg-muted px-1.5 py-0.5 text-[9px]">
          {cappedCount(count)}
        </span>
      ) : null}
    </button>
  );
}

function NotificationPreview({
  loading,
  error,
  items,
  onOpen,
  onOpenAll
}: {
  loading: boolean;
  error: string | null;
  items: NonNullable<
    ReturnType<
      typeof useNotificationSummary
    >['snapshot']
  >['items'];
  onOpen: (
    item: NonNullable<
      ReturnType<
        typeof useNotificationSummary
      >['snapshot']
    >['items'][number]
  ) => void;
  onOpenAll: () => void;
}) {
  return (
    <div>
      <div className="max-h-[min(27rem,58vh)] overflow-y-auto p-3">
        {loading ? (
          <LoadingState label="Loading notifications…" />
        ) : error ? (
          <ErrorState message={error} />
        ) : items.length ? (
          <div className="space-y-2">
            {items.map(item => (
              <button
                key={item.id}
                type="button"
                onClick={() =>
                  onOpen(item)
                }
                className={cn(
                  'flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition hover:bg-card',
                  item.readAt
                    ? 'border-transparent'
                    : 'border-primary/20 bg-primary/[0.045]'
                )}>
                <span
                  className={cn(
                    'mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl',
                    item.readAt
                      ? 'bg-muted text-muted-foreground'
                      : 'bg-primary text-primary-foreground'
                  )}>
                  <BellRing className="size-3.5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-2">
                    <strong className="truncate text-xs">
                      {item.title}
                    </strong>

                    {!item.readAt ? (
                      <span className="size-1.5 shrink-0 rounded-full bg-primary" />
                    ) : null}
                  </span>

                  <span className="mt-1 line-clamp-2 block text-[10px] leading-4 text-muted-foreground">
                    {item.message}
                  </span>

                  <span className="mt-2 block text-[9px] text-muted-foreground">
                    {dateFormatter.format(
                      new Date(
                        item.createdAt
                      )
                    )}
                  </span>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <EmptyPreview
            icon={
              <Bell className="size-6" />
            }
            title="No notifications yet"
            description="Verified order, delivery and support updates will appear here."
          />
        )}
      </div>

      <div className="border-t border-border/60 bg-card/50 p-3">
        <button
          type="button"
          onClick={onOpenAll}
          className="flex w-full items-center justify-center rounded-full bg-foreground px-4 py-2.5 text-xs font-semibold text-background transition hover:opacity-90">
          Open notification centre
        </button>
      </div>
    </div>
  );
}

function InboxPreview({
  authenticated,
  loading,
  error,
  conversations,
  onSignIn,
  onOpen,
  onOpenAll
}: {
  authenticated: boolean;
  loading: boolean;
  error: string | null;
  conversations:
    CommunicationConversationSummary[];
  onSignIn: () => void;
  onOpen: (
    conversation:
      CommunicationConversationSummary
  ) => void;
  onOpenAll: () => void;
}) {
  if (!authenticated) {
    return (
      <div className="p-3">
        <EmptyPreview
          icon={
            <Inbox className="size-6" />
          }
          title="Sign in to use Inbox"
          description="Your conversations and unread messages are protected by your Shelsea account."
          action={
            <button
              type="button"
              onClick={onSignIn}
              className="mt-4 rounded-full bg-foreground px-5 py-2.5 text-xs font-semibold text-background">
              Sign in
            </button>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <div className="max-h-[min(27rem,58vh)] overflow-y-auto p-3">
        {loading ? (
          <LoadingState label="Loading Inbox…" />
        ) : error ? (
          <ErrorState message={error} />
        ) : conversations.length ? (
          <div className="space-y-2">
            {conversations.map(
              conversation => (
                <button
                  key={
                    conversation.id
                  }
                  type="button"
                  onClick={() =>
                    onOpen(conversation)
                  }
                  className={cn(
                    'flex w-full items-start gap-3 rounded-2xl border p-3 text-left transition hover:bg-card',
                    conversation.unreadCount
                      ? 'border-sky-500/25 bg-sky-500/[0.045]'
                      : 'border-transparent bg-card/35'
                  )}>
                  <span
                    className={cn(
                      'mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl',
                      conversation.unreadCount
                        ? 'bg-sky-500 text-white'
                        : 'bg-muted text-muted-foreground'
                    )}>
                    <MessageCircle className="size-3.5" />
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <strong className="truncate text-xs">
                        {conversationTitle(
                          conversation
                        )}
                      </strong>

                      {conversation.unreadCount >
                      0 ? (
                        <span className="rounded-full bg-sky-500 px-1.5 py-0.5 text-[9px] font-bold text-white">
                          {cappedCount(
                            conversation.unreadCount
                          )}
                        </span>
                      ) : null}
                    </div>

                    <p className="mt-1 line-clamp-2 text-[10px] leading-4 text-muted-foreground">
                      {conversationPreview(
                        conversation
                      )}
                    </p>

                    <p className="mt-2 text-[9px] text-muted-foreground">
                      {conversation.lastMessageAt
                        ? dateFormatter.format(
                            new Date(
                              conversation.lastMessageAt
                            )
                          )
                        : 'Conversation created'}
                    </p>
                  </div>
                </button>
              )
            )}
          </div>
        ) : (
          <EmptyPreview
            icon={
              <PackageOpen className="size-6" />
            }
            title="Your Inbox is ready"
            description="Customer and vendor conversations will appear here as they begin."
          />
        )}
      </div>

      <div className="border-t border-border/60 bg-card/50 p-3">
        <button
          type="button"
          onClick={onOpenAll}
          className="flex w-full items-center justify-center rounded-full bg-foreground px-4 py-2.5 text-xs font-semibold text-background transition hover:opacity-90">
          Open Inbox
        </button>
      </div>
    </div>
  );
}

function LoadingState({
  label
}: {
  label: string;
}) {
  return (
    <div className="grid min-h-52 place-items-center text-center">
      <div>
        <LoaderCircle className="mx-auto size-5 animate-spin text-primary" />

        <p className="mt-3 text-xs text-muted-foreground">
          {label}
        </p>
      </div>
    </div>
  );
}

function ErrorState({
  message
}: {
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-destructive/20 bg-destructive/10 p-4 text-xs leading-5 text-destructive">
      {message}
    </div>
  );
}

function EmptyPreview({
  icon,
  title,
  description,
  action
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-border/70 bg-card/30 p-5 text-center">
      <div>
        <div className="mx-auto grid size-11 place-items-center rounded-2xl bg-muted text-muted-foreground">
          {icon}
        </div>

        <p className="mt-3 text-sm font-semibold">
          {title}
        </p>

        <p className="mx-auto mt-1 max-w-64 text-[11px] leading-5 text-muted-foreground">
          {description}
        </p>

        {action}
      </div>
    </div>
  );
}
