'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { LayoutGrid } from 'lucide-react';

import { categories as categoryDefinitions } from '@/data/categories';
import { requestFreshStoreExperience } from '@/features/customer-experience/customerExperienceEvents';
import { useCatalog } from '@/features/catalog';

export default function CategoryNavigation() {
  const [compact, setCompact] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { categories } = useCatalog();
  const available = new Map(categories.map(category => [category.slug, category]));
  const pills = categoryDefinitions
    .filter(category => category.slug !== 'all')
    .map(category => available.get(category.slug) ?? category)
    .concat([available.get('all') ?? categoryDefinitions[0]]);
  const selected = pathname.startsWith('/categories/')
    ? decodeURIComponent(pathname.slice('/categories/'.length))
    : pathname === '/' ? 'all' : null;

  useEffect(() => {
    const update = () => setCompact(window.scrollY > 160);
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, []);

  const openCategory = (slug: string) => {
    if (slug === 'all') {
      requestFreshStoreExperience();
      router.push('/');
      return;
    }
    router.push(`/categories/${encodeURIComponent(slug)}`);
  };

  return (
    <div className="min-w-0 border-b border-border bg-card text-card-foreground">
      {compact ? (
        <nav aria-label="Shop shortcuts" className="scrollbar-none min-w-0 overflow-x-auto px-[var(--app-page-gutter)] py-1.5">
          <div className="flex w-max items-center gap-2">
            <Link href="/featured-products" aria-current={pathname === '/featured-products' ? 'page' : undefined} className="inline-flex h-9 items-center rounded-full bg-primary px-4 text-xs font-semibold text-primary-foreground">Featured</Link>
            <Link href="/vendors?view=following" className="inline-flex h-9 items-center rounded-full border border-primary/30 bg-primary/10 px-4 text-xs font-semibold text-primary hover:bg-primary/15">Following</Link>
            <Link href="/account/lists" className="inline-flex h-9 items-center rounded-full border border-primary/30 bg-primary/10 px-4 text-xs font-semibold text-primary hover:bg-primary/15">Shopping Lists</Link>
          </div>
        </nav>
      ) : (
        <nav aria-label="Shop categories" className="scrollbar-none min-w-0 overflow-x-auto px-[var(--app-page-gutter)] py-2">
          <div className="grid w-max grid-flow-col grid-rows-2 auto-cols-[9rem] gap-1.5 sm:auto-cols-[10rem] lg:w-full lg:grid-flow-row lg:grid-cols-4 lg:auto-cols-auto">
            {pills.map(category => (
              <button key={category.id} type="button" onClick={() => openCategory(category.slug)}
                aria-current={selected === category.slug ? 'page' : undefined}
                className={`group flex h-10 min-w-0 items-center gap-2 overflow-hidden rounded-md border text-left text-xs font-semibold transition ${selected === category.slug ? 'border-accent bg-accent/15 text-foreground' : 'border-border bg-muted/60 text-foreground hover:bg-muted'}`}>
                {category.slug === 'all' ? (
                  <span className="grid size-10 shrink-0 place-items-center bg-accent/15"><LayoutGrid className="size-4" /></span>
                ) : (
                  <span className="relative block size-10 shrink-0 overflow-hidden bg-muted">
                    <Image src={category.image} alt="" fill sizes="40px" className="object-cover transition-transform group-hover:scale-105" />
                  </span>
                )}
                <span className="min-w-0 truncate pr-2">{category.slug === 'all' ? 'All Categories' : category.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}
