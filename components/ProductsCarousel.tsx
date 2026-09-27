'use client';

import { useRef, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

import ProductCard from './shared/ProductsCards';
import { ProductType } from '@/types/types';

type Props = {
  title: string;
  category: string;
  products: ProductType[];

  onSelect: (product: ProductType) => void;
  onToggleLike: (productId: string) => void;
};

export default function ProductsCarousel({ title, category, products, onSelect, onToggleLike }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);

  const isDragging = useRef(false);
  const startX = useRef(0);
  const scrollLeft = useRef(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener('wheel', handleNativeWheel, {
      passive: false
    });

    return () => {
      el.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  const scroll = (direction: 'left' | 'right') => {
    const el = containerRef.current;
    if (!el) return;

    el.scrollBy({
      left: direction === 'left' ? -400 : 400,
      behavior: 'smooth'
    });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el) return;

    isDragging.current = true;
    startX.current = e.pageX;
    scrollLeft.current = el.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = containerRef.current;
    if (!el || !isDragging.current) return;

    e.preventDefault();

    const walk = (e.pageX - startX.current) * 1.2;

    el.scrollLeft = scrollLeft.current - walk;
  };

  const stopDragging = () => {
    isDragging.current = false;
  };

  if (!products.length) return null;

  return (
    <section className="rounded-2xl premium-card px-6 py-4">
      {/* HEADER */}
      <div className="mb-5 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gradient-gold">{title}</h2>

          <div className="mt-1 h-0.5 w-16 rounded-full bg-gradient-premium" />

          <p className="mt-2 text-xs text-muted-foreground">{products.length} products available</p>
        </div>

        <div className="z-10 flex items-center gap-2">
          <Link
            href={`/categories/${encodeURIComponent(category)}`}
            className="
          text-sm font-medium text-accent
          transition-all duration-200
          hover:text-accent
        ">
            View All
          </Link>

          <button
            type="button"
            aria-label="Scroll left"
            onClick={() => scroll('left')}
            className="
          flex h-10 w-10 items-center justify-center
          rounded-full
          border border-accent/50
          bg-background
          text-primary
          transition-all duration-200
          hover:border-accent
          hover:text-accent
          cursor-pointer
        ">
            <ChevronLeft className="h-5 w-5" />
          </button>

          <button
            type="button"
            aria-label="Scroll right"
            onClick={() => scroll('right')}
            className="
          flex h-10 w-10 items-center justify-center
          rounded-full
          border border-accent/50
          bg-background
          text-primary
          transition-all duration-200
          hover:border-accent
          hover:text-accent
          cursor-pointer
        ">
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* PRODUCTS */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={stopDragging}
        onMouseLeave={stopDragging}
        className="
      flex gap-4 overflow-x-auto scroll-smooth
      cursor-grab select-none active:cursor-grabbing
      [&::-webkit-scrollbar]:hidden
      [-ms-overflow-style:none]
      [scrollbar-width:none]
    ">
        {products.map(product => (
          <div key={product.id} className="w-40 shrink-0 md:w-65">
            <ProductCard
              product={product}
              onSelect={() => onSelect(product)}
              onToggleLike={() => onToggleLike(product.id)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
