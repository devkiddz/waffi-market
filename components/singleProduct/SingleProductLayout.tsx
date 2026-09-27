'use client';

import { useMemo, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { ArrowLeft, ArrowRight, Check, ChevronRight, Heart, LoaderCircle, Minus, Plus, RotateCcw, ShieldCheck, ShoppingBag, Star, Truck } from 'lucide-react';

import { useCart } from '@/features/cart';
import { useCatalog } from '@/features/catalog';
import { openCustomerProductExperience } from '@/features/customer-experience';
import { ProductCard } from '@/features/products/cards';
import { useWishlist } from '@/features/wishlist';
import { cn } from '@/lib/utils';

import type { ProductType } from '@/types/types';

const currency = new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 });

export default function SingleProductLayout({ product }: { product: ProductType }) {
  const { products } = useCatalog();
  const { addToCart, mutating: cartMutating } = useCart();
  const { toggleWishlist, isWishlisted, isMutating } = useWishlist();
  const [selectedVariantId, setSelectedVariantId] = useState(String(product.variants.find(variant => variant.stockLeft > 0)?.id ?? product.variants[0]?.id ?? ''));
  const [quantity, setQuantity] = useState(1);

  const variant = product.variants.find(item => String(item.id) === selectedVariantId) ?? product.variants[0];
  const saved = isWishlisted(String(product.id));
  const wishlistBusy = isMutating(String(product.id));
  const outOfStock = !variant || variant.stockLeft <= 0;
  const recommendations = useMemo(() => products.filter(item => item.id !== product.id && item.category === product.category).slice(0, 5), [product, products]);

  if (!variant) return null;

  const addSelectedToCart = async () => {
    if (outOfStock) return;
    await addToCart({ product, variant, quantity });
  };

  return (
    <main className="min-h-screen bg-background pb-16">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-5 sm:px-6 sm:py-8">
        <nav aria-label="Breadcrumb" className="flex items-center gap-2 overflow-hidden text-xs text-muted-foreground">
          <Link href="/store" className="inline-flex shrink-0 items-center gap-1.5 font-semibold hover:text-foreground"><ArrowLeft className="size-3.5" /> Store</Link><ChevronRight className="size-3.5 shrink-0" /><Link href={`/store?category=${product.category}&view=grid`} className="truncate capitalize hover:text-foreground">{product.category.replaceAll('-', ' ')}</Link><ChevronRight className="size-3.5 shrink-0" /><span className="truncate text-foreground">{product.name}</span>
        </nav>

        <section className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,1.12fr)_minmax(24rem,.88fr)] xl:gap-10">
          <div className="min-w-0">
            <div className="group relative aspect-[16/11] min-h-[28rem] overflow-hidden rounded-[2rem] border border-border/50 bg-[#080b12] shadow-2xl sm:min-h-[36rem]">
              <Image src={variant.image} alt="" fill priority sizes="(max-width:1024px) 100vw, 58vw" className="scale-110 object-cover opacity-35 blur-2xl transition duration-700 group-hover:scale-125" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/15 to-black/25" />
              <Image src={variant.image} alt={`${product.name} — ${variant.label}`} fill priority sizes="(max-width:1024px) 100vw, 58vw" className="z-10 object-contain p-5 drop-shadow-[0_35px_55px_rgba(0,0,0,.55)] transition duration-700 group-hover:scale-[1.035] sm:p-10" />
              {product.discountPercentage > 0 ? <span className="absolute left-4 top-4 rounded-md bg-amber-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-black">Save {product.discountPercentage}%</span> : null}
            </div>

            {product.variants.length > 1 ? (
              <div className="mt-3 flex snap-x gap-2 overflow-x-auto pb-2 scrollbar-none" aria-label="Product options">
                {product.variants.map(item => <button key={item.id} type="button" onClick={() => { setSelectedVariantId(String(item.id)); setQuantity(1); }} aria-pressed={String(item.id) === selectedVariantId} className={cn('flex shrink-0 snap-start items-center gap-3 rounded-2xl border p-2 text-left transition', String(item.id) === selectedVariantId ? 'border-foreground bg-card shadow-md' : 'border-border/60 bg-card/50 hover:border-border')}><span className="relative size-14 overflow-hidden rounded-xl bg-muted"><Image src={item.image} alt="" fill sizes="56px" className="object-cover" /></span><span className="pr-2"><span className="block text-xs font-bold">{item.label}</span><span className={cn('mt-1 block text-[9px]', item.stockLeft > 0 ? 'text-emerald-600' : 'text-destructive')}>{item.stockLeft > 0 ? `${item.stockLeft} available` : 'Unavailable'}</span></span>{String(item.id) === selectedVariantId ? <Check className="size-4" /> : null}</button>)}
              </div>
            ) : null}
          </div>

          <aside className="lg:sticky lg:top-24 lg:self-start">
            <p className="text-xs font-black uppercase tracking-[.16em] text-primary">{product.category.replaceAll('-', ' ')}</p>
            <h1 className="mt-3 text-3xl font-black leading-tight tracking-[-.035em] sm:text-4xl xl:text-5xl">{product.name}</h1>
            {product.merchant ? <Link href={`/vendors/${encodeURIComponent(product.merchant.slug)}`} className="mt-2 inline-flex text-xs font-semibold text-muted-foreground transition hover:text-primary">Sold by {product.merchant.name}</Link> : null}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="inline-flex items-center gap-1"><Star className="size-4 fill-amber-400 text-amber-400" /><strong className="text-foreground">{product.rating.toFixed(1)}</strong></span><span>{product.reviews.toLocaleString()} reviews</span><span className="size-1 rounded-full bg-border" /><span>{product.soldCount.toLocaleString()} sold</span></div>
            <p className="mt-5 text-sm leading-6 text-muted-foreground sm:text-base">{product.shortDescription}</p>

            <div className="mt-7 rounded-[1.75rem] border border-border/60 bg-card p-5 shadow-xl sm:p-6">
              <div className="flex items-end justify-between gap-3"><div><p className="text-xs text-muted-foreground">{variant.label}</p><p className="mt-1 text-3xl font-black tracking-tight">{currency.format(variant.price)}</p></div><span className={cn('rounded-full px-3 py-1.5 text-[10px] font-bold', outOfStock ? 'bg-destructive/10 text-destructive' : variant.stockLeft <= 5 ? 'bg-amber-500/10 text-amber-600' : 'bg-emerald-500/10 text-emerald-600')}>{outOfStock ? 'Out of stock' : variant.stockLeft <= 5 ? `Only ${variant.stockLeft} left` : 'In stock'}</span></div>

              <div className="mt-5 flex items-center justify-between gap-3"><span className="text-xs font-bold">Quantity</span><div className="inline-flex items-center rounded-full border border-border/70 bg-background p-1"><button type="button" disabled={quantity <= 1 || cartMutating} onClick={() => setQuantity(current => current - 1)} className="grid size-8 place-items-center rounded-full hover:bg-muted disabled:opacity-30"><Minus className="size-3.5" /></button><span className="min-w-9 text-center text-sm font-black">{quantity}</span><button type="button" disabled={quantity >= variant.stockLeft || cartMutating} onClick={() => setQuantity(current => current + 1)} className="grid size-8 place-items-center rounded-full hover:bg-muted disabled:opacity-30"><Plus className="size-3.5" /></button></div></div>

              <div className="mt-5 grid grid-cols-[minmax(0,1fr)_3.25rem] gap-2">
                <button type="button" disabled={outOfStock || cartMutating} onClick={() => void addSelectedToCart()} className="inline-flex h-13 items-center justify-center gap-2 rounded-md bg-foreground px-5 text-sm font-black text-background transition hover:opacity-90 disabled:opacity-40">{cartMutating ? <LoaderCircle className="size-4 animate-spin" /> : <ShoppingBag className="size-4" />}{outOfStock ? 'Currently unavailable' : 'Add to cart'}</button>
                <button type="button" disabled={wishlistBusy} aria-pressed={saved} onClick={() => void toggleWishlist({ id: String(product.id), name: product.name })} aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'} className={cn('grid size-13 place-items-center rounded-md border border-border/70 transition hover:bg-muted', saved && 'border-rose-500/30 bg-rose-500/5 text-rose-500')}>{wishlistBusy ? <LoaderCircle className="size-4 animate-spin" /> : <Heart className={cn('size-5', saved && 'fill-current')} />}</button>
              </div>
              <p className="mt-3 text-center text-[10px] text-muted-foreground">Sign-in protected cart and wishlist activity</p>
            </div>

            <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3"><Assurance icon={<Truck />} title="Flexible delivery" text={product.estimatedDelivery} /><Assurance icon={<ShieldCheck />} title="Secure purchase" text="Protected checkout" /><Assurance icon={<RotateCcw />} title="Easy support" text="Help after purchase" /></div>
          </aside>
        </section>

        <section className="mt-12 grid gap-4 lg:grid-cols-[minmax(0,1.35fr)_minmax(18rem,.65fr)]">
          <article className="rounded-[2rem] border border-border/60 bg-card p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[.16em] text-primary">Product overview</p><h2 className="mt-3 text-2xl font-black">Everything you need to know</h2><p className="mt-5 whitespace-pre-line text-sm leading-7 text-muted-foreground">{product.longDescription}</p>{product.tags.length ? <div className="mt-6 flex flex-wrap gap-2">{product.tags.map(tag => <span key={tag} className="rounded-full bg-muted px-3 py-1.5 text-[10px] font-bold">{tag}</span>)}</div> : null}</article>
          <article className="rounded-[2rem] border border-border/60 bg-card p-6 sm:p-8"><p className="text-xs font-black uppercase tracking-[.16em] text-primary">Details</p><div className="mt-5 divide-y divide-border/60"><Detail label="Category" value={product.category.replaceAll('-', ' ')} /><Detail label="Options" value={String(product.variants.length)} /><Detail label="Availability" value={`${variant.stockLeft} in stock`} /><Detail label="Delivery" value={product.estimatedDelivery} /><Detail label="Customer rating" value={`${product.rating.toFixed(1)} / 5`} /></div></article>
        </section>

        {recommendations.length ? <section className="mt-12"><header className="mb-5 flex items-end justify-between"><div><p className="text-xs font-black uppercase tracking-[.16em] text-primary">Continue discovering</p><h2 className="mt-2 text-2xl font-black sm:text-3xl">Customers also explored</h2></div><Link href={`/store?category=${product.category}&view=grid`} className="hidden items-center gap-1 text-xs font-bold sm:inline-flex">See category <ArrowRight className="size-4" /></Link></header><div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-5 scrollbar-none sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-4 xl:grid-cols-5">{recommendations.map(item => <ProductCard key={item.id} product={item} onOpenExperience={selected => openCustomerProductExperience({ id: selected.id, name: selected.name, shortDescription: selected.shortDescription })} onPreview={selected => openCustomerProductExperience({ id: selected.id, name: selected.name, shortDescription: selected.shortDescription })} onAddToCart={(selected, selectedVariant) => void addToCart({ product: selected, variant: selectedVariant, quantity: 1 })} className="w-[72vw] max-w-[265px] shrink-0 snap-start sm:w-auto sm:max-w-none" />)}</div></section> : null}
      </div>
    </main>
  );
}

function Assurance({ icon, title, text }: { icon: React.ReactNode; title: string; text: string }) { return <div className="flex items-center gap-3 rounded-2xl border border-border/55 bg-card p-3"><span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">{icon}</span><span className="min-w-0"><span className="block text-[11px] font-black">{title}</span><span className="mt-0.5 block truncate text-[9px] text-muted-foreground">{text}</span></span></div>; }
function Detail({ label, value }: { label: string; value: string }) { return <div className="flex items-center justify-between gap-4 py-3 text-xs"><span className="text-muted-foreground">{label}</span><span className="text-right font-bold capitalize">{value}</span></div>; }
