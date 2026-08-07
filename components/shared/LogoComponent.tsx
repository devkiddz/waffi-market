'use client';

/* SHELSEA_LOGO_SYNTAX_FIX_V1 */

import Image from 'next/image';
import Link from 'next/link';

import {
  motion,
  useReducedMotion
} from 'framer-motion';

export default function LogoComponent({
  brandName = 'Shelsea',
  brandSlug = ''
}: {
  brandName?: string;
  brandSlug?: string;
}) {
  const reducedMotion =
    useReducedMotion();

  const accessibleName =
    `${brandName} ${brandSlug}`.trim() ||
    'Shelsea';

  return (
    <motion.div
      whileHover={
        reducedMotion
          ? undefined
          : {
              y: -1
            }
      }
      transition={{
        type: 'spring',
        stiffness: 300,
        damping: 24
      }}>
      <Link
        href="/"
        aria-label={`${accessibleName} home`}
        title={accessibleName}
        className="
          group relative
          inline-flex shrink-0
          items-center
          rounded-xl
          py-1.5
          outline-none
          transition
          focus-visible:ring-2
          focus-visible:ring-rose-400/60
        ">
        <span
          aria-hidden="true"
          className="
            pointer-events-none
            absolute inset-x-1
            -bottom-0.5 h-px
            origin-left
            scale-x-0
            bg-gradient-to-r
            from-rose-500
            via-rose-400
            to-transparent
            transition-transform
            duration-300
            group-hover:scale-x-100
          "
        />

        <Image
          src="/shelsea/brand/shelsea-logo-rose-500.png"
          alt=""
          width={641}
          height={220}
          priority
          className="
            h-8 w-auto
            select-none
            object-contain
            sm:h-9
            lg:h-10
          "
        />
      </Link>
    </motion.div>
  );
}
