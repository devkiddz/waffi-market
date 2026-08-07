'use client';

import Image from 'next/image';

import { AlertCircle, CheckCircle2, ChevronRight, Info, ShoppingBag, TriangleAlert, X } from 'lucide-react';

import { AnimatePresence, motion } from 'framer-motion';

import { cn } from '@/lib/utils';

import type { ActionFeedbackMessage, ActionFeedbackTone } from './actionFeedbackTypes';

type CartFeedbackItem = {
  id: string;
  productId: string;
  variantId: string;

  name: string;
  variantLabel?: string;
  image: string;

  quantity: number;
  price?: number;
};

type CartFeedbackPreview = {
  items: CartFeedbackItem[];

  totalQuantity?: number;
  totalAmount?: number;

  locale?: string;
  currency?: string;
};

type CartAwareActionFeedbackMessage = ActionFeedbackMessage & {
  /**
   * Increment this whenever an existing notification is updated.
   * This restarts the progress animation.
   */
  revision?: number;

  /**
   * Optional rich presentation used by cart notifications.
   */
  cartPreview?: CartFeedbackPreview;
};

type ActionFeedbackViewportProps = {
  messages: CartAwareActionFeedbackMessage[];

  onDismiss: (messageId: string) => void;
};

const MAX_VISIBLE_CART_ITEMS = 3;

const toneConfiguration = {
  success: {
    icon: CheckCircle2,

    label: 'Completed',

    iconClassName: 'bg-emerald-500/10 text-emerald-600',

    badgeClassName: 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600',

    progressClassName: 'bg-emerald-500'
  },

  error: {
    icon: AlertCircle,

    label: 'Action failed',

    iconClassName: 'bg-destructive/10 text-destructive',

    badgeClassName: 'border-destructive/20 bg-destructive/10 text-destructive',

    progressClassName: 'bg-destructive'
  },

  warning: {
    icon: TriangleAlert,

    label: 'Attention',

    iconClassName: 'bg-amber-500/10 text-amber-600',

    badgeClassName: 'border-amber-500/20 bg-amber-500/10 text-amber-600',

    progressClassName: 'bg-amber-500'
  },

  info: {
    icon: Info,

    label: 'Update',

    iconClassName: 'bg-blue-500/10 text-blue-600',

    badgeClassName: 'border-blue-500/20 bg-blue-500/10 text-blue-600',

    progressClassName: 'bg-blue-500'
  }
} satisfies Record<
  ActionFeedbackTone,
  {
    icon: typeof Info;
    label: string;
    iconClassName: string;
    badgeClassName: string;
    progressClassName: string;
  }
>;

function resolveCartQuantity(cartPreview: CartFeedbackPreview): number {
  if (typeof cartPreview.totalQuantity === 'number') {
    return cartPreview.totalQuantity;
  }

  return cartPreview.items.reduce((total, item) => total + item.quantity, 0);
}

function formatCurrency({
  amount,
  locale = 'en-NG',
  currency = 'NGN'
}: {
  amount: number;
  locale?: string;
  currency?: string;
}): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      maximumFractionDigits: 2
    }).format(amount);
  }
}

export function ActionFeedbackViewport({ messages, onDismiss }: ActionFeedbackViewportProps) {
  return (
    <div
      aria-live="polite"
      aria-relevant="additions removals"
      className="
        pointer-events-none fixed
        inset-x-3
        top-[calc(var(--app-navbar-height)+0.75rem)]
        z-[200]
        flex flex-col items-end gap-3
        sm:left-auto sm:right-5
        sm:top-[calc(var(--app-navbar-height)+1rem)]
        sm:w-full sm:max-w-md
      ">
      <AnimatePresence initial={false}>
        {messages.map(message => {
          const configuration = toneConfiguration[message.tone];

          const cartPreview = message.cartPreview?.items.length ? message.cartPreview : null;

          const Icon = cartPreview ? ShoppingBag : configuration.icon;

          const bannerLabel = message.banner?.label ?? 'Shelsea';

          const bannerDetail =
            message.banner?.detail ?? (cartPreview ? 'Your shopping cart' : 'Experience notification');

          const bannerBadge = message.banner?.badge ?? (cartPreview ? 'Cart updated' : configuration.label);

          const visibleCartItems = cartPreview?.items.slice(0, MAX_VISIBLE_CART_ITEMS) ?? [];

          const remainingCartItems = cartPreview
            ? Math.max(0, cartPreview.items.length - MAX_VISIBLE_CART_ITEMS)
            : 0;

          const cartQuantity = cartPreview ? resolveCartQuantity(cartPreview) : 0;

          return (
            <motion.article
              key={message.id}
              layout
              initial={{
                opacity: 0,
                y: -20,
                scale: 0.96
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1
              }}
              exit={{
                opacity: 0,
                x: 32,
                scale: 0.97
              }}
              transition={{
                duration: 0.22,
                ease: 'easeOut'
              }}
              role={message.tone === 'error' ? 'alert' : 'status'}
              className="
                pointer-events-auto relative
                w-full overflow-hidden
                rounded-3xl
                border border-primary/10
                bg-card shadow-2xl
              ">
              {/* =============================================
                  NOTIFICATION HEADER
              ============================================= */}

              <div
                className="
                  relative overflow-hidden
                  border-b border-primary/10
                  bg-gradient-to-r
                  from-primary/15
                  via-primary/5
                  to-transparent
                  px-4 py-3
                ">
                <div className="absolute -right-8 -top-8 size-24 rounded-full bg-primary/10 blur-2xl" />

                <div className="relative flex items-center gap-3">
                  <div
                    className="
                      grid size-10 shrink-0
                      place-items-center
                      rounded-2xl bg-primary
                      text-xs font-black
                      tracking-tight
                      text-primary-foreground
                      shadow-sm
                    ">
                    S
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-sm font-semibold text-foreground">{bannerLabel}</p>

                      <span
                        className={cn(
                          `
                            rounded-full border
                            px-2 py-0.5
                            text-[10px] font-semibold
                            uppercase tracking-wide
                          `,
                          configuration.badgeClassName
                        )}>
                        {bannerBadge}
                      </span>
                    </div>

                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{bannerDetail}</span>

                      <span aria-hidden="true" className="size-1 rounded-full bg-muted-foreground/40" />

                      <span className="shrink-0">Now</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    aria-label="Dismiss notification"
                    onClick={() => onDismiss(message.id)}
                    className="
                      grid size-8 shrink-0
                      place-items-center
                      rounded-full
                      text-muted-foreground
                      transition
                      hover:bg-background/60
                      hover:text-foreground
                    ">
                    <X className="size-4" />
                  </button>
                </div>
              </div>

              {/* =============================================
                  NOTIFICATION CONTENT
              ============================================= */}

              <div className="px-4 py-4">
                <div className="flex items-start gap-3">
                  <div
                    className={cn(
                      `
                        grid size-11 shrink-0
                        place-items-center
                        rounded-2xl
                      `,
                      configuration.iconClassName
                    )}>
                    <Icon className="size-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold leading-5 text-foreground">{message.title}</p>

                    {message.description ? (
                      <p className="mt-1.5 text-sm leading-6 text-muted-foreground">{message.description}</p>
                    ) : null}
                  </div>
                </div>

                {/* =========================================
                    RICH CART PRODUCT PREVIEW
                ========================================= */}

                {cartPreview ? (
                  <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-background/70">
                    <div className="divide-y divide-border">
                      {visibleCartItems.map(item => (
                        <div
                          key={`${item.productId}:${item.variantId}`}
                          className="flex items-center gap-3 p-3">
                          <div
                            className="
                              relative size-14 shrink-0
                              overflow-hidden rounded-xl
                              border border-border
                              bg-muted
                            ">
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="56px"
                              className="object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="line-clamp-1 text-sm font-semibold text-foreground">{item.name}</p>

                            <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
                              {item.variantLabel ? (
                                <span className="truncate">{item.variantLabel}</span>
                              ) : null}

                              {item.variantLabel ? (
                                <span
                                  aria-hidden="true"
                                  className="size-1 rounded-full bg-muted-foreground/35"
                                />
                              ) : null}

                              <span className="shrink-0">Qty {item.quantity}</span>
                            </div>
                          </div>

                          {typeof item.price === 'number' ? (
                            <p className="shrink-0 text-xs font-semibold text-foreground">
                              {formatCurrency({
                                amount: item.price * item.quantity,
                                locale: cartPreview.locale,
                                currency: cartPreview.currency
                              })}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>

                    {remainingCartItems > 0 ? (
                      <div className="border-t border-border px-3 py-2 text-center">
                        <p className="text-[11px] font-medium text-muted-foreground">
                          +{remainingCartItems} {remainingCartItems === 1 ? 'more product' : 'more products'}{' '}
                          added
                        </p>
                      </div>
                    ) : null}

                    <div
                      className="
                        flex items-center
                        justify-between gap-3
                        border-t border-border
                        bg-muted/30
                        px-3 py-3
                      ">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                          Added to cart
                        </p>

                        <p className="mt-0.5 text-xs font-semibold text-foreground">
                          {cartQuantity} {cartQuantity === 1 ? 'item' : 'items'}
                        </p>
                      </div>

                      {typeof cartPreview.totalAmount === 'number' ? (
                        <p className="text-sm font-bold text-foreground">
                          {formatCurrency({
                            amount: cartPreview.totalAmount,
                            locale: cartPreview.locale,
                            currency: cartPreview.currency
                          })}
                        </p>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                {/* =========================================
                    NOTIFICATION ACTION
                ========================================= */}

                {message.action ? (
                  <button
                    type="button"
                    onClick={() => {
                      message.action?.onSelect();
                      onDismiss(message.id);
                    }}
                    className="
                      mt-4 inline-flex
                      items-center gap-1.5
                      text-xs font-semibold
                      text-primary transition
                      hover:opacity-70
                    ">
                    {message.action.label}

                    <ChevronRight className="size-3.5" />
                  </button>
                ) : null}
              </div>

              {/* =============================================
                  AUTO-CLOSE PROGRESS
              ============================================= */}

              {message.duration > 0 ? (
                <div className="h-1 w-full bg-muted">
                  <motion.div
                    key={`${message.id}:${message.revision ?? 0}`}
                    initial={{
                      scaleX: 1
                    }}
                    animate={{
                      scaleX: 0
                    }}
                    transition={{
                      duration: message.duration / 1000,
                      ease: 'linear'
                    }}
                    style={{
                      transformOrigin: 'left'
                    }}
                    className={cn('h-full w-full', configuration.progressClassName)}
                  />
                </div>
              ) : null}
            </motion.article>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
