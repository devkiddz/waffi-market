'use client';

import Image from 'next/image';

import {
  ArrowRight,
  ClipboardList,
  Globe2,
  ListPlus,
  LoaderCircle
} from 'lucide-react';

import {
  useMemo
} from 'react';

import {
  useRouter
} from 'next/navigation';

import {
  useOptionalShoppingLists
} from '@/features/shopping-lists';

import {
  useIdentity
} from '@/providers/IdentityProvider';

function formatCurrency(
  value: number
): string {
  return new Intl.NumberFormat(
    'en-NG',
    {
      style:
        'currency',

      currency:
        'NGN',

      maximumFractionDigits:
        0
    }
  ).format(
    value
  );
}

function getPublicationLabel(
  value:
    | 'PRIVATE'
    | 'PENDING_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
): string {
  switch (
    value
  ) {
    case 'APPROVED':
      return 'Public';

    case 'PENDING_REVIEW':
      return 'Awaiting approval';

    case 'REJECTED':
      return 'Needs revision';

    default:
      return 'Private';
  }
}

export default function ShoppingListsWidget() {
  const router =
    useRouter();

  const {
    isAuthenticated,
    isPending
  } = useIdentity();

  const context =
    useOptionalShoppingLists();

  const latestList =
    useMemo(() => {
      if (
        !context
      ) {
        return null;
      }

      return [
        ...context.lists
      ].sort(
        (
          first,
          second
        ) =>
          new Date(
            second.updatedAt
          ).getTime() -
          new Date(
            first.updatedAt
          ).getTime()
      )[0] ??
        null;
    }, [
      context
    ]);

  const totals =
    useMemo(() => {
      if (
        !context
      ) {
        return {
          items:
            0,

          quantity:
            0,

          value:
            0
        };
      }

      return context.lists.reduce(
        (
          summary,
          list
        ) => ({
          items:
            summary.items +
            list.itemCount,

          quantity:
            summary.quantity +
            list.totalQuantity,

          value:
            summary.value +
            list.totalValue
        }),
        {
          items:
            0,

          quantity:
            0,

          value:
            0
        }
      );
    }, [
      context
    ]);

  const loading =
    isPending ||
    Boolean(
      context?.loading
    );

  return (
    <section
      className="
        overflow-hidden rounded-3xl
        border border-primary/12
        bg-card/40 p-5
        shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_20px_60px_rgba(0,0,0,0.25)]
      ">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className="
              text-[11px] font-semibold
              uppercase tracking-[0.2em]
              text-primary/45
            ">
            Personal planning
          </p>

          <h3
            className="
              mt-1 text-base
              font-bold tracking-tight
              text-primary
            ">
            Shopping Lists
          </h3>

          <p
            className="
              mt-1 text-xs leading-5
              text-primary/50
            ">
            Your live customer-owned plans, quantities and publication state.
          </p>
        </div>

        <span
          className="
            grid size-11 shrink-0
            place-items-center
            rounded-2xl
            bg-primary/10
            text-primary
          ">
          <ClipboardList className="size-5" />
        </span>
      </header>

      {loading ? (
        <div className="mt-5 flex items-center gap-3 rounded-2xl border border-primary/10 bg-background/30 p-4">
          <LoaderCircle className="size-4 animate-spin text-primary" />

          <p className="text-xs text-primary/55">
            Loading your shopping plans
          </p>
        </div>
      ) : !isAuthenticated ||
      !context ? (
        <div
          className="
            mt-5 rounded-2xl
            border border-dashed
            border-primary/15
            bg-background/30
            p-5 text-center
          ">
          <ListPlus className="mx-auto size-7 text-primary/35" />

          <p className="mt-3 text-sm font-semibold text-primary">
            Sign in to create Shopping Lists
          </p>

          <p className="mt-1 text-xs leading-5 text-primary/50">
            Customer-owned lists remain connected to your account across Shelsea.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                '/sign-in?returnTo=%2Fstore'
              )
            }
            className="
              mt-4 inline-flex
              items-center gap-2
              rounded-full
              bg-primary px-4 py-2
              text-xs font-semibold
              text-background
            ">
            Sign in

            <ArrowRight className="size-3.5" />
          </button>
        </div>
      ) : context.error ? (
        <div className="mt-5 rounded-2xl border border-destructive/20 bg-destructive/10 p-4">
          <p className="text-xs leading-5 text-destructive">
            {
              context.error
            }
          </p>
        </div>
      ) : context.lists.length ===
        0 ? (
        <div
          className="
            mt-5 rounded-2xl
            border border-dashed
            border-primary/15
            bg-background/30
            p-5 text-center
          ">
          <ListPlus className="mx-auto size-7 text-primary/35" />

          <p className="mt-3 text-sm font-semibold text-primary">
            No Shopping List yet
          </p>

          <p className="mt-1 text-xs leading-5 text-primary/50">
            Use Add to List on any product to create your first reusable shopping plan.
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                '/store'
              )
            }
            className="
              mt-4 inline-flex
              items-center gap-2
              rounded-full border
              border-primary/15
              bg-background/50
              px-4 py-2
              text-xs font-semibold
              text-primary transition
              hover:bg-primary
              hover:text-background
            ">
            Explore products

            <ArrowRight className="size-3.5" />
          </button>
        </div>
      ) : (
        <>
          {latestList ? (
            <button
              type="button"
              onClick={() =>
                router.push(
                  '/account#shopping-lists'
                )
              }
              className="
                group mt-5 flex
                w-full items-center
                gap-3 rounded-2xl
                border border-primary/10
                bg-background/35
                p-3 text-left
                transition
                hover:border-primary/20
                hover:bg-background/55
              ">
              <div className="flex -space-x-3">
                {latestList.items
                  .slice(
                    0,
                    3
                  )
                  .map(
                    item => (
                      <span
                        key={
                          item.id
                        }
                        className="
                          relative size-12
                          overflow-hidden
                          rounded-xl border-2
                          border-background
                          bg-muted
                        ">
                        <Image
                          src={
                            item.variant
                              ?.image ??
                            item.product
                              .variants[0]
                              ?.image ??
                            '/placeholder.svg'
                          }
                          alt=""
                          fill
                          sizes="48px"
                          className="object-cover"
                        />
                      </span>
                    )
                  )}

                {latestList.items.length ===
                0 ? (
                  <span
                    className="
                      grid size-12
                      place-items-center
                      rounded-xl border-2
                      border-background
                      bg-muted
                    ">
                    <ListPlus className="size-4 text-muted-foreground" />
                  </span>
                ) : null}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-2">
                  <p className="truncate text-xs font-semibold text-primary">
                    {
                      latestList.name
                    }
                  </p>

                  {latestList.publicationStatus ===
                  'APPROVED' ? (
                    <Globe2 className="size-3 shrink-0 text-emerald-500" />
                  ) : null}
                </div>

                <p className="mt-1 text-[10px] text-primary/45">
                  {
                    latestList.itemCount
                  }{' '}
                  {latestList.itemCount ===
                  1
                    ? 'product'
                    : 'products'}{' '}
                  ·{' '}
                  {getPublicationLabel(
                    latestList.publicationStatus
                  )}
                </p>
              </div>

              <ArrowRight
                className="
                  size-4 shrink-0
                  text-primary/35
                  transition
                  group-hover:translate-x-1
                "
              />
            </button>
          ) : null}

          <div className="mt-3 grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-background/40 p-3">
              <p className="text-[9px] uppercase tracking-wide text-primary/40">
                Lists
              </p>

              <p className="mt-1 text-lg font-bold text-primary">
                {
                  context.lists.length
                }
              </p>
            </div>

            <div className="rounded-2xl bg-background/40 p-3">
              <p className="text-[9px] uppercase tracking-wide text-primary/40">
                Products
              </p>

              <p className="mt-1 text-lg font-bold text-primary">
                {
                  totals.items
                }
              </p>
            </div>

            <div className="rounded-2xl bg-background/40 p-3">
              <p className="text-[9px] uppercase tracking-wide text-primary/40">
                Value
              </p>

              <p className="mt-1 truncate text-sm font-bold text-primary">
                {
                  formatCurrency(
                    totals.value
                  )
                }
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={
              context.mutating
            }
            onClick={() =>
              router.push(
                '/account#shopping-lists'
              )
            }
            className="
              mt-4 flex w-full
              items-center justify-center
              gap-2 rounded-full
              bg-primary px-4 py-2.5
              text-xs font-semibold
              text-background transition
              hover:opacity-90
              disabled:opacity-60
            ">
            Open Shopping Lists

            <ArrowRight className="size-3.5" />
          </button>
        </>
      )}
    </section>
  );
}
