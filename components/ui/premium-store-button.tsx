'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Landmark } from 'lucide-react';

interface PremiumStoreButtonProps {
  active?: boolean;
  onClick?: () => void;
}

export default function PremiumStoreButton({ active = false, onClick }: PremiumStoreButtonProps) {
  return (
    <>
      <Button
        variant="ghost"
        onClick={onClick}
        className={cn(
          'premium-store-btn group relative h-8 overflow-hidden rounded-full px-3 text-xs font-medium hover:text-accent cursor-pointer transition-all duration-300',
          active ? 'text-white premium-store-icon' : 'text-white hover:text-accent'
        )}>
        {/* Breathing Glow */}
        <span className="premium-store-glow" />

        {/* Glass Surface */}
        <span className="premium-store-surface" />

        {/* Shimmer */}
        <span className="premium-store-shimmer" />

        {/* Content */}
        <span
          className={cn('premium-store-content relative z-20 flex items-center gap-2', active && 'active')}>
          <Landmark className="premium-store-icon h-4 w-4" />
          <span>Store</span>
        </span>
      </Button>

      <style jsx global>{`
        .premium-store-btn {
          isolation: isolate;
          border: 1px solid rgba(244, 63, 94, 0.45);
          background: transparent;
        }

        /* Small breathing glow */
        .premium-store-glow {
          position: absolute;
          inset: -4px;
          border-radius: inherit;
          background: radial-gradient(
            circle,
            rgba(244, 63, 94, 0.24) 0%,
            rgba(244, 63, 94, 0.08) 55%,
            transparent 100%
          );
          filter: blur(8px);
          z-index: 0;
          animation: storeGlow 4s ease-in-out infinite;
        }

        /* Glass */
        .premium-store-surface {
          position: absolute;
          inset: 1px;
          border-radius: inherit;
          background: linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)), #081120;
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.15),
            inset 0 -6px 10px rgba(0, 0, 0, 0.35);
          z-index: 1;
        }

        /* Shimmer */
        .premium-store-shimmer {
          position: absolute;
          inset: 1px;
          overflow: hidden;
          border-radius: inherit;
          z-index: 2;
        }

        .premium-store-shimmer::before {
          content: '';
          position: absolute;
          left: -35%;
          top: 0;
          width: 20%;
          height: 100%;
          transform: skewX(-20deg);
          background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.45), transparent);
          animation: storeShimmer 6s linear infinite;
        }

        .premium-store-icon {
          color: #fb7185;
          animation: storeFloat 2.5s ease-in-out infinite;
        }

        .premium-store-btn:hover {
          border-color: rgba(251, 113, 133, 0.92);
          transform: translateY(-1px);
          transition: all 0.3s ease;
        }

        .premium-store-btn:hover .premium-store-glow {
          opacity: 0.8;
        }

        @keyframes storeGlow {
          0%,
          100% {
            opacity: 0.45;
            transform: scale(1);
          }

          50% {
            opacity: 0.75;
            transform: scale(1.04);
          }
        }

        @keyframes storeShimmer {
          0% {
            transform: translateX(-250%) skewX(-20deg);
          }

          100% {
            transform: translateX(650%) skewX(-20deg);
          }
        }

        @keyframes storeFloat {
          0%,
          100% {
            transform: translateY(0);
          }

          50% {
            transform: translateY(-1.5px);
          }
        }
      `}</style>
    </>
  );
}
