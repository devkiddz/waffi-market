'use client';

import Image from 'next/image';

import Link from 'next/link';

import {
  ArrowRight,
  Globe2,
  LoaderCircle
} from 'lucide-react';

import {
  useEffect,
  useState
} from 'react';

import {
  createPortal
} from 'react-dom';

import {
  getApprovedPublicShoppingLists
} from '../client/shoppingListService';

import type {
  ShoppingList
} from '../shoppingListTypes';

type PublicShoppingListRailProps = {
  workspaceId: string;
};

const PUBLIC_SHOPPING_LIST_SLOT_ID =
  'public-shopping-list-feed-slot';

export function PublicShoppingListRail({
  workspaceId
}: PublicShoppingListRailProps) {
  const [
    lists,
    setLists
  ] = useState<
    ShoppingList[]
  >([]);

  const [
    loading,
    setLoading
  ] = useState(true);

  const [
    target,
    setTarget
  ] =
    useState<HTMLElement | null>(
      null
    );

  useEffect(() => {
    const frameId =
      window.requestAnimationFrame(
        () => {
          setTarget(
            document.getElementById(
              PUBLIC_SHOPPING_LIST_SLOT_ID
            )
          );
        }
      );

    return () => {
      window.cancelAnimationFrame(
        frameId
      );
    };
  }, []);

  useEffect(() => {
    const controller =
      new AbortController();

    queueMicrotask(() => {
      if (
        !controller.signal
          .aborted
      ) {
        setLists([]);
        setLoading(true);
      }
    });

    void getApprovedPublicShoppingLists(
      workspaceId
    )
      .then(result => {
        if (
          !controller.signal
            .aborted
        ) {
          setLists(
            result
          );
        }
      })
      .catch(() => {
        if (
          !controller.signal
            .aborted
        ) {
          setLists([]);
        }
      })
      .finally(() => {
        if (
          !controller.signal
            .aborted
        ) {
          setLoading(
            false
          );
        }
      });

    return () =>
      controller.abort();
  }, [
    workspaceId
  ]);

  if (!target) {
    return null;
  }

  if (loading) {
    return createPortal(
      <section
        className="
          rounded-3xl border
          bg-card/65 p-5
        ">
        <div
          className="
            flex items-center
            gap-2 text-sm
            text-muted-foreground
          ">
          <LoaderCircle className="size-4 animate-spin" />

          Loading approved public plans
        </div>
      </section>,
      target
    );
  }

  if (
    lists.length === 0
  ) {
    return null;
  }

  return createPortal(
    <section
      className="
        overflow-hidden
        rounded-3xl border
        bg-card/70 shadow-sm
      ">
      <header
        className="
          flex flex-col gap-3
          border-b px-5 py-5
          sm:flex-row
          sm:items-end
          sm:justify-between
        ">
        <div>
          <div className="flex items-center gap-2 text-primary">
            <Globe2 className="size-4" />

            <p
              className="
                text-xs font-bold
                uppercase
                tracking-[0.18em]
              ">
              Approved community plans
            </p>
          </div>

          <h2
            className="
              mt-2 text-xl
              font-bold tracking-tight
              sm:text-2xl
            ">
            Shopping ideas shared by customers
          </h2>

          <p
            className="
              mt-1 max-w-2xl
              text-sm
              text-muted-foreground
            ">
            Only lists intentionally shared by their owners and approved by Shelsea appear here.
          </p>
        </div>
      </header>

      <div
        className="
          flex snap-x
          snap-mandatory gap-4
          overflow-x-auto
          px-5 py-5
          scrollbar-hide
        ">
        {lists.map(
          list => (
            <Link
              key={
                list.id
              }
              href={`/lists/${list.id}`}
              className="
                group w-[18rem]
                shrink-0 snap-start
                overflow-hidden
                rounded-2xl border
                bg-background
                transition
                hover:-translate-y-0.5
                hover:border-primary/25
                hover:shadow-lg
                sm:w-[20rem]
              ">
              <div className="grid h-40 grid-cols-2 gap-px bg-border">
                {list.items
                  .slice(
                    0,
                    4
                  )
                  .map(
                    (
                      item,
                      index
                    ) => (
                      <span
                        key={
                          item.id
                        }
                        className="
                          relative
                          overflow-hidden
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
                          sizes="160px"
                          className="
                            object-cover
                            transition
                            duration-300
                            group-hover:scale-105
                          "
                        />

                        {index ===
                          3 &&
                        list.itemCount >
                          4 ? (
                          <span
                            className="
                              absolute inset-0
                              grid place-items-center
                              bg-black/55
                              text-sm font-bold
                              text-white
                            ">
                            +
                            {list.itemCount -
                              3}
                          </span>
                        ) : null}
                      </span>
                    )
                  )}

                {list.items
                  .length ===
                1 ? (
                  <span className="bg-muted/60" />
                ) : null}

                {list.items
                  .length ===
                2 ? (
                  <>
                    <span className="bg-muted/60" />
                    <span className="bg-muted/60" />
                  </>
                ) : null}

                {list.items
                  .length ===
                3 ? (
                  <span className="bg-muted/60" />
                ) : null}
              </div>

              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p
                      className="
                        text-[11px]
                        font-bold uppercase
                        tracking-[0.14em]
                        text-emerald-600
                      ">
                      Approved public list
                    </p>

                    <h3 className="mt-1 truncate font-semibold">
                      {
                        list.name
                      }
                    </h3>
                  </div>

                  <ArrowRight
                    className="
                      mt-1 size-4
                      shrink-0
                      text-muted-foreground
                      transition
                      group-hover:translate-x-1
                    "
                  />
                </div>

                <p
                  className="
                    mt-2 line-clamp-2
                    min-h-10 text-sm
                    text-muted-foreground
                  ">
                  {list.description ??
                    'A customer-curated shopping plan.'}
                </p>

                <p
                  className="
                    mt-3 border-t
                    pt-3 text-xs
                    font-semibold
                    text-muted-foreground
                  ">
                  {
                    list.itemCount
                  }{' '}
                  {list.itemCount ===
                  1
                    ? 'product'
                    : 'products'}
                </p>
              </div>
            </Link>
          )
        )}
      </div>
    </section>,
    target
  );
}
