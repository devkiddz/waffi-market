'use client';

import Image from 'next/image';
import Link from 'next/link';

import { ArrowRight, FolderKanban, LoaderCircle, Sparkles } from 'lucide-react';

import { useCatalog } from '@/features/catalog';

import { resolveCollectionProducts, sortCollections } from '../collectionCatalog';
import CollectionProductsHeader from '../components/CollectionProductsHeader';

export default function CollectionsDirectoryExperience() {
  const { collections, products, loading, error } = useCatalog();

  if (loading) {
    return (
      <main className="grid min-h-[60dvh] place-items-center px-4">
        <div className="flex items-center gap-3 text-sm font-semibold text-muted-foreground">
          <LoaderCircle className="size-5 animate-spin" />
          Loading collections
        </div>
      </main>
    );
  }

  const visibleCollections = sortCollections(collections)
    .map(collection => ({
      collection,
      resolvedProducts: resolveCollectionProducts(collection, products)
    }))
    .filter(item => item.resolvedProducts.length > 0);

  return (
    <main className="mx-auto min-h-dvh w-full max-w-[96rem] px-3 py-5 sm:px-5 sm:py-8 lg:px-7">
      <header className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/75 p-6 shadow-xl sm:p-9">
        <div className="pointer-events-none absolute -right-24 -top-32 size-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-primary">
            <Sparkles className="size-3.5" />
            Curated shopping experiences
          </span>
          <h1 className="mt-5 text-3xl font-bold tracking-tight sm:text-5xl">
            Collections
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
            Browse every published Shelsea collection and continue into its complete product experience.
          </p>
        </div>
      </header>

      {error ? (
        <div className="mt-6 rounded-2xl border border-destructive/20 bg-destructive/5 p-4 text-sm text-destructive">
          {error}
        </div>
      ) : null}

      {visibleCollections.length > 0 ? (
        <section className="mt-7 space-y-6">
          {visibleCollections.map(({ collection, resolvedProducts }) => {
            const href = `/collections/${encodeURIComponent(collection.slug)}`;

            return (
              <article
                key={collection.id}
                className="overflow-hidden rounded-3xl border border-border/60 bg-card/75 shadow-lg">
                {collection.banner?.image ? (
                  <div className="relative aspect-[9/2] w-full overflow-hidden bg-muted">
                    <Image
                      src={collection.banner.image}
                      alt={`${collection.title} collection cover`}
                      fill
                      sizes="(max-width: 768px) 100vw, 1400px"
                      className="object-cover object-center"
                    />
                  </div>
                ) : (
                  <div className="grid aspect-[9/2] place-items-center bg-muted/50">
                    <FolderKanban className="size-8 text-muted-foreground" />
                  </div>
                )}

                <div className="p-4 sm:p-5">
                  <CollectionProductsHeader
                    title={collection.title}
                    subtitle={collection.subtitle}
                    productCount={resolvedProducts.length}
                    href={href}
                  />

                  <div className="mt-4 flex items-center gap-2 overflow-hidden">
                    {resolvedProducts.slice(0, 6).map(product => {
                      const image = product.variants[0]?.image;

                      return image ? (
                        <div
                          key={product.id}
                          className="relative size-12 shrink-0 overflow-hidden rounded-xl border border-border/60 bg-muted sm:size-14">
                          <Image
                            src={image}
                            alt=""
                            fill
                            sizes="56px"
                            className="object-cover"
                          />
                        </div>
                      ) : null;
                    })}

                    {resolvedProducts.length > 6 ? (
                      <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-border/60 bg-muted text-[0.65rem] font-bold text-muted-foreground sm:size-14">
                        +{resolvedProducts.length - 6}
                      </span>
                    ) : null}
                  </div>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <section className="mt-7 grid min-h-72 place-items-center rounded-[2rem] border border-dashed border-border/70 bg-muted/20 p-8 text-center">
          <div>
            <FolderKanban className="mx-auto size-8 text-muted-foreground" />
            <h2 className="mt-4 text-xl font-bold">No published collections</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Collections will appear here after publication.
            </p>
            <Link
              href="/store"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-xs font-bold text-background">
              Return to Store
              <ArrowRight className="size-3.5" />
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}
