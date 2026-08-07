'use client';

import { useRouter } from 'next/navigation';

import { Landmark } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { cn } from '@/lib/utils';

interface StoreButtonProps {
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export default function StoreButton({ active = false, onClick, className }: StoreButtonProps) {
  const router = useRouter();

  const handleClick = (): void => {
    router.push('/store');

    onClick?.();
  };

  return (
    <Button
      type="button"
      variant="ghost"
      onClick={handleClick}
      className={cn(
        `
          group relative
          h-10 overflow-hidden
          rounded-full border
          border-orange-400/30
          bg-transparent px-5
          font-semibold
          transition-all duration-300
          hover:scale-[1.02]
        `,
        className
      )}>
      {/* Animated gradient */}

      <div
        aria-hidden="true"
        className={cn(
          `
            absolute inset-0
            animate-store-gradient
            bg-[linear-gradient(120deg,#fd8c3a,#ffb65a,#fd8c3a)]
            bg-[length:300%_300%]
            transition-opacity duration-500
          `,
          active ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'
        )}
      />

      {/* Shine */}

      <div
        aria-hidden="true"
        className="
          absolute inset-0
          overflow-hidden rounded-full
        ">
        <div
          className="
            absolute left-[-50%] top-0
            h-full w-1/4
            skew-x-[-20deg]
            animate-store-shine
            bg-white/30 blur-lg
          "
        />
      </div>

      {/* Glow */}

      <div
        aria-hidden="true"
        className="
          absolute inset-0
          rounded-full
          shadow-[0_0_25px_rgba(253,140,58,.25)]
        "
      />

      {/* Content */}

      <span
        className="
          relative z-10
          flex items-center gap-2
          text-white
        ">
        <Landmark className="size-4 animate-store-float" />
        Shelsea Store
      </span>
    </Button>
  );
}
