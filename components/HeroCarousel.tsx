'use client';

import { useEffect, useState } from 'react';

import Image from 'next/image';

import {
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

const slides = [
  {
    id: 1,
    image:
      'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?q=85&w=1800&auto=format&fit=crop',
    badge: 'Shelsea Clothing',
    title: 'Dress With Intention',
    description:
      'Discover polished clothing selected for work, weekends and memorable occasions.'
  },
  {
    id: 2,
    image:
      'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=85&w=1800&auto=format&fit=crop',
    badge: 'Apparel & Accessories',
    title: 'Complete the Look',
    description:
      'Explore bags, shoes, jewelry, watches and finishing pieces that elevate every outfit.'
  },
  {
    id: 3,
    image:
      'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?q=85&w=1800&auto=format&fit=crop',
    badge: 'Shelsea Hair',
    title: 'Your Crown, Your Signature',
    description:
      'Shop premium wigs, extensions and hair essentials for confident everyday styling.'
  },
  {
    id: 4,
    image:
      'https://images.unsplash.com/photo-1541643600914-78b084683601?q=85&w=1800&auto=format&fit=crop',
    badge: 'Signature Scents',
    title: 'Leave a Lasting Impression',
    description:
      'Discover elegant women, men and unisex fragrances for every mood and occasion.'
  }
];

export default function HeroCarousel() {
  const [current, setCurrent] =
    useState(0);

  const nextSlide = () => {
    setCurrent(previous =>
      (previous + 1) % slides.length
    );
  };

  const prevSlide = () => {
    setCurrent(previous =>
      (previous - 1 + slides.length) %
      slides.length
    );
  };

  useEffect(() => {
    const timer = window.setTimeout(
      nextSlide,
      5000
    );

    return () => {
      window.clearTimeout(timer);
    };
  }, [current]);

  return (
    <section className="relative overflow-hidden rounded-md">
      <div className="relative aspect-16/8">
        <div
          className="flex h-full transition-transform duration-700 ease-in-out"
          style={{
            transform: `translateX(-${current * 100}%)`
          }}>
          {slides.map(slide => (
            <div
              key={slide.id}
              className="relative min-w-full">
              <Image
                src={slide.image}
                alt={slide.title}
                fill
                sizes="100vw"
                className="object-cover scale-105"
                priority={slide.id === 1}
              />

              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-black/10" />

              <div className="absolute inset-0 flex items-center">
                <div className="max-w-xl px-8 text-white md:px-16">
                  <span className="rounded-full bg-white/15 px-3 py-1 text-xs backdrop-blur-3xl">
                    {slide.badge}
                  </span>

                  <h1 className="mt-2 text-2xl font-bold text-white drop-shadow-lg md:mt-4 md:text-5xl">
                    {slide.title}
                  </h1>

                  <p className="mt-2 max-w-lg text-sm font-medium text-white/90 md:text-base">
                    {slide.description}
                  </p>

                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      className="cursor-pointer rounded-full bg-secondary px-5 py-2 text-xs text-white md:text-sm">
                      Shop Now
                    </button>

                    <button
                      type="button"
                      className="cursor-pointer rounded-full border border-white/30 bg-black/15 px-5 py-2 text-xs text-white backdrop-blur-3xl transition-all hover:bg-black/30 md:text-sm">
                      Explore
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          aria-label="Previous slide"
          type="button"
          onClick={prevSlide}
          className="absolute left-0 top-0 z-20 flex h-full w-10 cursor-pointer items-center justify-center bg-gradient-to-r from-black/35 to-transparent md:w-16">
          <ChevronLeft className="h-8 w-8 text-white" />
        </button>

        <button
          aria-label="Next slide"
          type="button"
          onClick={nextSlide}
          className="absolute right-0 top-0 z-20 flex h-full w-10 cursor-pointer items-center justify-center bg-gradient-to-l from-black/35 to-transparent md:w-16">
          <ChevronRight className="h-8 w-8 text-white" />
        </button>

        <div className="absolute bottom-5 left-1/2 z-20 flex -translate-x-1/2 gap-2">
          {slides.map((slide, index) => (
            <button
              aria-label={`Go to slide ${index + 1}`}
              type="button"
              key={slide.id}
              onClick={() =>
                setCurrent(index)
              }
              className={`h-2 cursor-pointer rounded-full transition-all ${
                current === index
                  ? 'w-4 bg-white'
                  : 'w-2 bg-white/50'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
