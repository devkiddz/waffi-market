import Image from 'next/image';

import {
  ArrowRight,
  Sparkles
} from 'lucide-react';

import type { Promo } from '@/data/promos';

import type { ProductType } from '@/types/types';

type Props = {
  promo: Promo;
  products: ProductType[];
  onSelect?: (id: string) => void;
};

export default function PromoCard({
  promo,
  products,
  onSelect
}: Props) {
  const firstProduct =
    products[0];

  const image =
    promo.image ??
    firstProduct?.variants[0]?.image;

  const openPromo = (): void => {
    onSelect?.(
      promo.id
    );
  };

  return (
    <article
      role="button"
      tabIndex={0}
      aria-label={`Open ${promo.title}`}
      onClick={
        openPromo
      }
      onKeyDown={
        event => {
          if (
            event.key ===
              'Enter' ||
            event.key ===
              ' '
          ) {
            event.preventDefault();

            openPromo();
          }
        }
      }
      className="
        group relative
        h-[19rem]
        cursor-pointer
        overflow-hidden
        rounded-[1.6rem]
        border
        border-white/8
        bg-card
        shadow-[0_18px_42px_rgba(0,0,0,0.22)]
        transition
        duration-500
        hover:-translate-y-0.5
        hover:border-accent/30
        hover:shadow-[0_22px_50px_rgba(0,0,0,0.30)]
        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-accent/60
      "
    >
      {image ? (
        <Image
          src={image}
          alt={promo.title}
          fill
          sizes="
            (max-width: 640px) 86vw,
            (max-width: 1024px) 52vw,
            340px
          "
          className="
            object-cover
            object-center
            transition
            duration-700
            ease-out
            group-hover:scale-[1.025]
          "
        />
      ) : (
        <div className="absolute inset-0 bg-muted" />
      )}

      <div
        aria-hidden="true"
        className="
          pointer-events-none
          absolute inset-0
          bg-gradient-to-t
          from-black/35
          via-transparent
          to-black/5
        "
      />

      <div
        className="
          pointer-events-none
          absolute left-3
          top-3 z-10
        "
      >
        <span
          className="
            inline-flex
            items-center gap-1.5
            rounded-full
            border border-white/15
            bg-black/38
            px-3 py-1.5
            text-[9px]
            font-semibold
            uppercase
            tracking-[0.14em]
            text-white
            shadow-lg
            backdrop-blur-xl
          "
        >
          <Sparkles className="size-3 text-accent" />

          {promo.badge}
        </span>
      </div>

      <section
        className="
          absolute
          inset-x-3
          bottom-3
          z-20
          rounded-[1.25rem]
          border
          border-white/12
          bg-[rgba(13,24,45,0.92)]
          p-4
          shadow-[0_16px_38px_rgba(0,0,0,0.34)]
          backdrop-blur-xl
        "
      >
        <div
          className="
            absolute
            inset-x-0
            top-0
            h-px
            rounded-t-[1.25rem]
            bg-gradient-to-r
            from-secondary/80
            via-accent/95
            to-primary/80
          "
        />

        <div
          className="
            flex
            items-start
            justify-between
            gap-3
          "
        >
          <div className="min-w-0 flex-1">
            <p
              className="
                text-[9px]
                font-semibold
                uppercase
                tracking-[0.16em]
                text-white/42
              "
            >
              Shelsea offer
            </p>

            <h3
              className="
                mt-1
                line-clamp-1
                text-[15px]
                font-bold
                tracking-tight
                text-white
              "
            >
              {promo.title}
            </h3>

            {promo.subtitle ? (
              <p
                className="
                  mt-1
                  line-clamp-1
                  text-[10px]
                  text-white/55
                "
              >
                {promo.subtitle}
              </p>
            ) : null}
          </div>

          {promo.discountPercent ? (
            <span
              className="
                shrink-0
                rounded-full
                bg-accent/12
                px-2.5 py-1
                text-[10px]
                font-bold
                text-accent
              "
            >
              -{promo.discountPercent}%
            </span>
          ) : null}
        </div>

        <div
          className="
            mt-3
            flex
            items-center
            justify-between
            gap-3
          "
        >
          <p
            className="
              text-[10px]
              text-white/42
            "
          >
            {products.length}{' '}
            {products.length === 1
              ? 'product'
              : 'products'}
          </p>

          <button
            type="button"
            onClick={
              event => {
                event.stopPropagation();

                openPromo();
              }
            }
            className="
              inline-flex
              h-8
              items-center
              gap-1.5
              rounded-full
              bg-white
              px-3.5
              text-[10px]
              font-semibold
              text-slate-950
              transition
              hover:bg-white/90
            "
          >
            Discover

            <ArrowRight className="size-3.5" />
          </button>
        </div>
      </section>
    </article>
  );
}
