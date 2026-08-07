'use client';

import {
  useEffect,
  useMemo,
  useState
} from 'react';

import {
  CheckCircle2,
  Copy,
  Globe2,
  LoaderCircle,
  PackageOpen,
  ShoppingBag,
  Sparkles
} from 'lucide-react';

import {
  useRouter
} from 'next/navigation';

import {
  useActionFeedback
} from '@/features/action-feedback';

import {
  useCart
} from '@/features/cart';

import {
  publishCustomerExperienceIntent
} from '@/features/customer-experience';

import {
  useIdentity
} from '@/providers/IdentityProvider';

import {
  useOptionalShoppingLists
} from '../client';

import type {
  ShoppingList,
  ShoppingListItem
} from '../shoppingListTypes';

import {
  PublicShoppingListProductCard
} from './PublicShoppingListProductCard';

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

function resolveAvailableVariant(
  item: ShoppingListItem
) {
  if (
    item.variant &&
    item.variant.stockLeft >
      0
  ) {
    return item.variant;
  }

  return (
    item.product.variants.find(
      variant =>
        variant.stockLeft >
        0
    ) ??
    null
  );
}

function createCopyName(
  originalName: string,
  existingNames: string[]
): string {
  const normalizedNames =
    new Set(
      existingNames.map(
        name =>
          name
            .trim()
            .toLowerCase()
      )
    );

  const base =
    `${originalName} Copy`;

  if (
    !normalizedNames.has(
      base.toLowerCase()
    )
  ) {
    return base;
  }

  let index =
    2;

  while (
    normalizedNames.has(
      `${base} ${index}`.toLowerCase()
    )
  ) {
    index +=
      1;
  }

  return `${base} ${index}`;
}

export function PublicShoppingListExperience({
  list
}: {
  list: ShoppingList;
}) {
  const router =
    useRouter();

  const feedback =
    useActionFeedback();

  const {
    addToCart
  } = useCart();

  const {
    isAuthenticated,
    isPending
  } = useIdentity();

  const shoppingLists =
    useOptionalShoppingLists();

  const [
    addingAll,
    setAddingAll
  ] = useState(false);

  const [
    copying,
    setCopying
  ] = useState(false);

  const availableItems =
    useMemo(
      () =>
        list.items
          .map(
            item => ({
              item,

              variant:
                resolveAvailableVariant(
                  item
                )
            })
          )
          .filter(
            (
              entry
            ): entry is {
              item:
                ShoppingListItem;

              variant:
                NonNullable<
                  ReturnType<
                    typeof resolveAvailableVariant
                  >
                >;
            } =>
              Boolean(
                entry.variant
              )
          ),
      [
        list.items
      ]
    );

  const unavailableCount =
    list.items.length -
    availableItems.length;

  useEffect(() => {
    const route =
      `/lists/${list.id}`;

    publishCustomerExperienceIntent({
      id:
        `public-shopping-list:${list.id}:${Date.now()}`,

      type:
        'home',

      source:
        'route',

      categorySlug:
        'all',

      route,

      surface:
        'shopping-list',

      title:
        list.name,

      subtitle:
        'Approved public shopping list',

      createdAt:
        new Date().toISOString()
    });
  }, [
    list.id,
    list.name
  ]);

  const addAvailableItemsToCart =
    async () => {
      if (
        addingAll
      ) {
        return;
      }

      if (
        availableItems.length ===
        0
      ) {
        feedback.warning({
          title:
            'No available products',

          description:
            'Every product in this public list is currently unavailable.',

          groupKey:
            `public-list:${list.id}:cart`
        });

        return;
      }

      setAddingAll(
        true
      );

      try {
        for (
          const {
            item,
            variant
          } of availableItems
        ) {
          await addToCart({
            product:
              item.product,

            variant,

            quantity:
              Math.min(
                item.quantity,
                variant.stockLeft
              )
          });
        }

        feedback.success({
          title:
            'Available products added',

          description:
            `${availableItems.length} ${availableItems.length === 1 ? 'product is' : 'products are'} now in your cart.${unavailableCount > 0 ? ` ${unavailableCount} unavailable ${unavailableCount === 1 ? 'product was' : 'products were'} skipped.` : ''}`,

          groupKey:
            `public-list:${list.id}:cart`
        });
      } catch (
        error
      ) {
        feedback.error({
          title:
            'Public list could not be added',

          description:
            error instanceof
            Error
              ? error.message
              : 'Shelsea could not add the available products to your cart.',

          groupKey:
            `public-list:${list.id}:cart`
        });
      } finally {
        setAddingAll(
          false
        );
      }
    };

  const copyToMyLists =
    async () => {
      if (
        copying ||
        isPending
      ) {
        return;
      }

      if (
        !isAuthenticated ||
        !shoppingLists
      ) {
        router.push(
          `/sign-in?returnTo=${encodeURIComponent(
            `/lists/${list.id}`
          )}`
        );

        return;
      }

      if (
        availableItems.length ===
        0
      ) {
        feedback.warning({
          title:
            'List cannot be copied yet',

          description:
            'The public list has no currently available product variant.',

          groupKey:
            `public-list:${list.id}:copy`
        });

        return;
      }

      setCopying(
        true
      );

      try {
        const name =
          createCopyName(
            list.name,
            shoppingLists.lists.map(
              currentList =>
                currentList.name
            )
          );

        const result =
          await shoppingLists.createList({
            name,

            description:
              `Copied from the approved public list “${list.name}”.`
          });

        const createdList =
          result.affectedList;

        if (
          !createdList
        ) {
          throw new Error(
            'Shelsea created no destination list.'
          );
        }

        for (
          const {
            item,
            variant
          } of availableItems
        ) {
          await shoppingLists.addItem(
            createdList.id,
            {
              productId:
                item.product.id,

              variantId:
                variant.id,

              quantity:
                item.quantity,

              ...(item.note
                ? {
                    note:
                      item.note
                  }
                : {})
            }
          );
        }

        feedback.success({
          title:
            'Public list copied',

          description:
            `${name} is now one of your private Shopping Lists.${unavailableCount > 0 ? ` ${unavailableCount} unavailable ${unavailableCount === 1 ? 'product was' : 'products were'} skipped.` : ''}`,

          groupKey:
            `public-list:${list.id}:copy`
        });

        router.push(
          `/account/lists/${createdList.id}`
        );
      } catch (
        error
      ) {
        feedback.error({
          title:
            'Public list was not copied',

          description:
            error instanceof
            Error
              ? error.message
              : 'Shelsea could not create a private copy.',

          groupKey:
            `public-list:${list.id}:copy`
        });
      } finally {
        setCopying(
          false
        );
      }
    };

  return (
    <main className="mx-auto w-full max-w-7xl px-3 py-5 sm:px-6 lg:px-8 lg:py-8">
      <header
        className="
          relative overflow-hidden
          rounded-[2rem] border
          bg-card p-5
          shadow-sm sm:p-8
        ">
        <div className="pointer-events-none absolute -right-16 -top-24 size-72 rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="relative grid gap-7 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-end">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
              <Globe2 className="size-3.5" />

              Admin-approved public list
            </div>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight sm:text-5xl">
              {
                list.name
              }
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              {list.description ??
                'A customer-curated shopping plan shared with the Shelsea community.'}
            </p>

            <div className="mt-5 flex flex-wrap gap-2 text-xs font-semibold text-muted-foreground">
              <span className="rounded-full border bg-background/70 px-3 py-1.5">
                {
                  list.itemCount
                }{' '}
                products
              </span>

              <span className="rounded-full border bg-background/70 px-3 py-1.5">
                {
                  list.totalQuantity
                }{' '}
                planned items
              </span>

              <span className="rounded-full border bg-background/70 px-3 py-1.5">
                {
                  formatCurrency(
                    list.totalValue
                  )
                }
              </span>

              <span className="rounded-full border bg-background/70 px-3 py-1.5 text-emerald-600">
                {
                  availableItems.length
                }{' '}
                currently available
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={
                addingAll ||
                list.items.length ===
                  0
              }
              onClick={() =>
                void addAvailableItemsToCart()
              }
              className="
                inline-flex h-11
                items-center gap-2
                rounded-xl bg-foreground
                px-5 text-sm font-semibold
                text-background
                transition hover:opacity-90
                disabled:opacity-50
              ">
              {addingAll ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <ShoppingBag className="size-4" />
              )}

              Add available to Cart
            </button>

            <button
              type="button"
              disabled={
                copying ||
                isPending ||
                list.items.length ===
                  0
              }
              onClick={() =>
                void copyToMyLists()
              }
              className="
                inline-flex h-11
                items-center gap-2
                rounded-xl border
                bg-background/70
                px-5 text-sm font-semibold
                transition hover:bg-muted
                disabled:opacity-50
              ">
              {copying ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Copy className="size-4" />
              )}

              {isAuthenticated
                ? 'Copy to My Lists'
                : 'Sign in to copy'}
            </button>
          </div>
        </div>
      </header>

      <section className="mt-5 grid gap-3 sm:grid-cols-3">
        <article className="rounded-3xl border bg-card/70 p-4">
          <Sparkles className="size-4 text-primary" />

          <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Community discovery
          </p>

          <p className="mt-1 text-sm font-semibold">
            Every product opens inside the global Product Experience.
          </p>
        </article>

        <article className="rounded-3xl border bg-card/70 p-4">
          <CheckCircle2 className="size-4 text-emerald-500" />

          <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Availability aware
          </p>

          <p className="mt-1 text-sm font-semibold">
            Out-of-stock variants are clearly skipped rather than silently failing.
          </p>
        </article>

        <article className="rounded-3xl border bg-card/70 p-4">
          <Copy className="size-4 text-violet-500" />

          <p className="mt-3 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
            Reusable planning
          </p>

          <p className="mt-1 text-sm font-semibold">
            Copy the available contents into a new private customer-owned list.
          </p>
        </article>
      </section>

      <section className="mt-7">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
            List contents
          </p>

          <h2 className="mt-1 text-2xl font-semibold tracking-tight">
            Explore every planned product
          </h2>

          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Product details remain the priority experience. This public list stays preserved as the originating context in Experience History.
          </p>
        </div>

        {list.items.length >
        0 ? (
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {list.items.map(
              item => (
                <PublicShoppingListProductCard
                  key={
                    item.id
                  }
                  item={
                    item
                  }
                  listId={
                    list.id
                  }
                  listName={
                    list.name
                  }
                />
              )
            )}
          </div>
        ) : (
          <div className="mt-5 grid min-h-72 place-items-center rounded-3xl border border-dashed bg-muted/10 p-8 text-center">
            <div>
              <PackageOpen className="mx-auto size-8 text-muted-foreground" />

              <h3 className="mt-4 font-semibold">
                This public list is empty
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-muted-foreground">
                It remains visible only as an approved list record; no products can be actioned.
              </p>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
