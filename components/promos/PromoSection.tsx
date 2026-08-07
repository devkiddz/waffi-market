'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import {
  ArrowRightCircle,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import Link from 'next/link';
import {
  useRouter
} from 'next/navigation';

import type {
  Promo
} from '@/data/promos';

import type {
  ProductType
} from '@/types/types';

import PromoCard from './PromoCard';

import {
  Button
} from '../ui/button';

type Props = {
  promos: Promo[];
  products: ProductType[];
  onSelect?: (
    id: string
  ) => void;
};

const AUTO_SLIDE_MS =
  5200;

export default function PromoSection({
  promos,
  products,
  onSelect
}: Props) {
  const router =
    useRouter();

  const scrollRef =
    useRef<HTMLDivElement>(
      null
    );

  const [
    activeIndex,
    setActiveIndex
  ] =
    useState(0);

  const [
    isHovered,
    setIsHovered
  ] =
    useState(false);

  const activePromos =
    useMemo(
      () =>
        promos
          .filter(
            promo =>
              promo.active
          )
          .sort(
            (
              first,
              second
            ) =>
              first.priority -
              second.priority
          ),
      [
        promos
      ]
    );

  const goTo =
    useCallback(
      (
        index: number
      ) => {
        if (
          activePromos.length ===
          0
        ) {
          return;
        }

        const normalizedIndex =
          (
            index +
            activePromos.length
          ) %
          activePromos.length;

        setActiveIndex(
          normalizedIndex
        );

        const container =
          scrollRef.current;

        const item =
          container
            ?.children[
              normalizedIndex
            ] as
            | HTMLElement
            | undefined;

        if (
          container &&
          item
        ) {
          container.scrollTo({
            left:
              item.offsetLeft,
            behavior:
              'smooth'
          });
        }
      },
      [
        activePromos.length
      ]
    );

  useEffect(
    () => {
      if (
        isHovered ||
        activePromos.length <=
          1
      ) {
        return;
      }

      const timer =
        window.setInterval(
          () => {
            setActiveIndex(
              currentIndex => {
                const nextIndex =
                  (
                    currentIndex +
                    1
                  ) %
                  activePromos.length;

                const container =
                  scrollRef.current;

                const item =
                  container
                    ?.children[
                      nextIndex
                    ] as
                    | HTMLElement
                    | undefined;

                if (
                  container &&
                  item
                ) {
                  container.scrollTo({
                    left:
                      item.offsetLeft,
                    behavior:
                      'smooth'
                  });
                }

                return nextIndex;
              }
            );
          },
          AUTO_SLIDE_MS
        );

      return () =>
        window.clearInterval(
          timer
        );
    },
    [
      activePromos.length,
      isHovered
    ]
  );

  if (
    activePromos.length ===
    0
  ) {
    return null;
  }

  const selectPromo = (
    promo: Promo
  ) => {
    if (
      onSelect
    ) {
      onSelect(
        promo.id
      );

      return;
    }

    router.push(
      promo.href ??
        `/promos/${promo.slug}`
    );
  };

  return (
    <section className="space-y-4">
      <div
        className="
          flex
          items-end
          justify-between
          gap-4
        "
      >
        <div>
          <p
            className="
              text-[10px]
              font-semibold
              uppercase
              tracking-[0.18em]
              text-muted-foreground
            "
          >
            Shelsea campaigns
          </p>

          <h2
            className="
              mt-1
              text-xl
              font-bold
              tracking-tight
            "
          >
            Promos & Deals
          </h2>

          <p
            className="
              mt-0.5
              text-sm
              text-muted-foreground
            "
          >
            Fresh offers worth discovering.
          </p>
        </div>

        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <button
            type="button"
            onClick={() =>
              goTo(
                activeIndex -
                  1
              )
            }
            aria-label="Previous promotion"
            className="
              hidden
              size-9
              place-items-center
              rounded-full
              border
              border-border/70
              bg-card
              text-muted-foreground
              transition
              hover:border-accent/40
              hover:text-foreground
              md:grid
            "
          >
            <ChevronLeft className="size-4" />
          </button>

          <button
            type="button"
            onClick={() =>
              goTo(
                activeIndex +
                  1
              )
            }
            aria-label="Next promotion"
            className="
              hidden
              size-9
              place-items-center
              rounded-full
              border
              border-border/70
              bg-card
              text-muted-foreground
              transition
              hover:border-accent/40
              hover:text-foreground
              md:grid
            "
          >
            <ChevronRight className="size-4" />
          </button>

          <Link
            href="/promos"
            className="
              hidden
              md:block
            "
          >
            <Button
              variant="outline"
              size="sm"
              className="
                gap-2
                rounded-full
              "
            >
              All

              <ArrowRightCircle className="size-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div
        className="relative"
        onMouseEnter={() =>
          setIsHovered(
            true
          )
        }
        onMouseLeave={() =>
          setIsHovered(
            false
          )
        }
      >
        <div
          ref={
            scrollRef
          }
          className="
            flex
            gap-4
            overflow-x-auto
            pb-2
            scrollbar-hide
            snap-x
            snap-mandatory
          "
          style={{
            scrollbarWidth:
              'none',
            msOverflowStyle:
              'none'
          }}
        >
          {activePromos.map(
            (
              promo,
              index
            ) => (
              <div
                key={
                  promo.id
                }
                className="
                  min-w-[82vw]
                  snap-start
                  sm:min-w-[320px]
                  lg:min-w-[350px]
                "
              >
                <PromoCard
                  promo={
                    promo
                  }
                  products={
                    products.filter(
                      product =>
                        promo.productIds.includes(
                          product.id
                        )
                    )
                  }
                  onSelect={() =>
                    selectPromo(
                      promo
                    )
                  }
                />
              </div>
            )
          )}
        </div>

        {activePromos.length >
        1 ? (
          <div
            className="
              mt-3
              flex
              justify-center
              gap-1.5
            "
          >
            {activePromos.map(
              (
                promo,
                index
              ) => (
                <button
                  key={
                    promo.id
                  }
                  type="button"
                  onClick={() =>
                    goTo(
                      index
                    )
                  }
                  aria-label={`Show ${promo.title}`}
                  className={
                    index ===
                    activeIndex
                      ? 'h-1.5 w-6 rounded-full bg-accent transition-all'
                      : 'h-1.5 w-1.5 rounded-full bg-muted-foreground/30 transition-all hover:bg-muted-foreground/50'
                  }
                />
              )
            )}
          </div>
        ) : null}
      </div>
    </section>
  );
}
