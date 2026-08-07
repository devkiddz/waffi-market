import Link from 'next/link';
import {
  ArrowLeft,
  Boxes,
  CheckCircle2,
  Save,
  ShieldCheck,
  Sparkles,
  Store
} from 'lucide-react';

import { StudioSelectField } from '@/features/studio-controls';
import { ProductSavedPreview } from './ProductSavedPreview';
import {
  ProductStudioFields,
  type ProductStudioMedia,
  type ProductStudioVariant
} from './ProductStudioFields';
import { createProduct, updateProduct } from './actions';

type EditorProduct = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  subcategoryId: string | null;
  brandId: string | null;
  vendorProfileId: string | null;
  shortDescription: string | null;
  longDescription: string | null;
  estimatedDelivery: string | null;
  tags: string[];
  active: boolean;
  featured: boolean;
  isNew: boolean;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'PUBLISHED' | 'PAUSED' | 'REJECTED' | 'ARCHIVED';
  discountPercentage: number;
  mediaAssetIds: string[];
  existingImageCount: number;
  variants: ProductStudioVariant[];
} | null;

type Taxonomy = {
  categories: Array<{ id: string; label: string; subcategories: Array<{ id: string; label: string }> }>;
  brands: Array<{ id: string; name: string }>;
  vendors: Array<{ id: string; name: string }>;
};

export default function AdminProductEditor({
  product,
  taxonomy,
  media,
  canManage,
  canPublish,
  multivendorEnabled
}: {
  product: EditorProduct;
  taxonomy: Taxonomy;
  media: ProductStudioMedia[];
  canManage: boolean;
  canPublish: boolean;
  multivendorEnabled: boolean;
}) {
  const editing = Boolean(product);

  return (
    <main className="min-h-dvh bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.1),transparent_34%)] px-3 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-[90rem] space-y-5">
        <header className="rounded-[2rem] border border-border/60 bg-card/80 p-5 shadow-xl sm:p-7">
          <Link href="/admin/products" className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="size-4" /> Product Studio</Link>
          <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary/70">Catalog, media and inventory</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">{editing ? `Edit ${product?.name}` : 'Create product'}</h1>
              <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">Complete the product identity, reusable media gallery, variants, pricing, stock and publishing state in one Studio.</p>
            </div>
            <span className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-3 py-2 text-[10px] font-bold text-emerald-600"><ShieldCheck className="size-4" /> Server-authorized writes</span>
          </div>
        </header>

        {!canManage ? <div className="rounded-3xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-700"><strong>Read-only access.</strong> Product creation or editing permission is required to save changes.</div> : null}

        <form action={editing ? updateProduct : createProduct} className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          {product ? <input type="hidden" name="id" value={product.id} /> : null}
          <div className="space-y-5">
            <EditorCard icon={<Boxes />} title="Product identity" description="Customer-facing title, URL, taxonomy, ownership and descriptions.">
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Product name"><input name="name" required defaultValue={product?.name} className={inputClass} /></Field><Field label="URL slug"><input name="slug" required defaultValue={product?.slug} className={inputClass} /></Field></div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Category">
                  <StudioSelectField name="categoryId" defaultValue={product?.categoryId ?? ''} options={[{ value: '', label: 'Select category' }, ...taxonomy.categories.map(category => ({ value: category.id, label: category.label }))]} />
                </Field>
                <Field label="Subcategory">
                  <StudioSelectField name="subcategoryId" defaultValue={product?.subcategoryId ?? ''} options={[{ value: '', label: 'No subcategory' }, ...taxonomy.categories.flatMap(category => category.subcategories.map(subcategory => ({ value: subcategory.id, label: `${category.label} · ${subcategory.label}` })))]} />
                </Field>
                <Field label="Brand">
                  <StudioSelectField name="brandId" defaultValue={product?.brandId ?? ''} options={[{ value: '', label: 'No brand' }, ...taxonomy.brands.map(brand => ({ value: brand.id, label: brand.name }))]} />
                </Field>
              </div>
              {multivendorEnabled ? (
                <Field label="Vendor owner">
                  <StudioSelectField name="vendorProfileId" defaultValue={product?.vendorProfileId ?? ''} options={[{ value: '', label: 'Shelsea workspace product' }, ...taxonomy.vendors.map(vendor => ({ value: vendor.id, label: vendor.name }))]} />
                </Field>
              ) : null}
              <Field label="Short description"><input name="shortDescription" defaultValue={product?.shortDescription ?? ''} className={inputClass} /></Field>
              <Field label="Long description"><textarea name="longDescription" defaultValue={product?.longDescription ?? ''} rows={6} className={inputClass} /></Field>
            </EditorCard>

            <EditorCard icon={<Sparkles />} title="Commerce details" description="Delivery promise, search tags and offer treatment.">
              <div className="grid gap-4 sm:grid-cols-2"><Field label="Estimated delivery"><input name="estimatedDelivery" defaultValue={product?.estimatedDelivery ?? ''} placeholder="2–4 business days" className={inputClass} /></Field><Field label="Discount percentage"><input name="discountPercentage" type="number" min="0" max="100" defaultValue={product?.discountPercentage ?? 0} className={inputClass} /></Field></div>
              <Field label="Tags (comma separated)"><input name="tags" defaultValue={product?.tags.join(', ') ?? ''} className={inputClass} /></Field>
            </EditorCard>

            <ProductStudioFields media={media} initialMediaIds={product?.mediaAssetIds ?? []} initialVariants={product?.variants ?? []} retainedImageCount={product?.existingImageCount ?? 0} />
          </div>

          <aside className="space-y-5 xl:sticky xl:top-5 xl:self-start">
            <EditorCard icon={<CheckCircle2 />} title="Publishing" description="Control review, availability and merchandising signals.">
              <Field label="Product status">
                <StudioSelectField
                  name="status"
                  defaultValue={product?.status ?? 'DRAFT'}
                  options={[
                    { value: 'DRAFT', label: 'Draft' },
                    { value: 'PENDING_REVIEW', label: 'Pending review' },
                    ...(canPublish ? [{ value: 'PUBLISHED', label: 'Published' }] : []),
                    { value: 'PAUSED', label: 'Paused' },
                    { value: 'ARCHIVED', label: 'Archived' }
                  ]}
                />
              </Field>
              <Toggle name="active" label="Active product" description="Visible and purchasable after publication." defaultChecked={product?.active ?? false} />
              <Toggle name="featured" label="Featured" description="Eligible for premium featured placements." defaultChecked={product?.featured ?? false} />
              <Toggle name="isNew" label="New arrival" description="Show new-product merchandising treatment." defaultChecked={product?.isNew ?? true} />
            </EditorCard>

            <EditorCard icon={<Store />} title="Media workflow" description="All images are selected from the workspace Media Studio.">
              <Link href="/admin/media" className="inline-flex w-full items-center justify-center rounded-full border border-border/70 px-4 py-3 text-xs font-bold transition hover:bg-muted">Open Media Studio</Link>
              <ProductSavedPreview product={product} media={media} />
            </EditorCard>

            <button type="submit" disabled={!canManage} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-foreground px-5 text-sm font-bold text-background shadow-lg transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"><Save className="size-4" /> {editing ? 'Save complete product' : 'Create product'}</button>
            <p className="text-center text-[10px] leading-5 text-muted-foreground">Managers submit publication changes for review. Admin approval rights may publish directly.</p>
          </aside>
        </form>
      </div>
    </main>
  );
}


const inputClass = 'min-h-11 w-full rounded-2xl border border-border/70 bg-background/70 px-3 py-2 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10';
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <label className="block"><span className="mb-2 block text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">{label}</span>{children}</label>; }
function EditorCard({ icon, title, description, children }: { icon: React.ReactNode; title: string; description: string; children: React.ReactNode }) { return <section className="rounded-[2rem] border border-border/60 bg-card/75 p-5 shadow-lg sm:p-6"><div className="flex gap-3"><div className="grid size-10 shrink-0 place-items-center rounded-2xl bg-primary/10 text-primary [&_svg]:size-4">{icon}</div><div><h2 className="font-bold">{title}</h2><p className="mt-1 text-xs leading-5 text-muted-foreground">{description}</p></div></div><div className="mt-6 space-y-4">{children}</div></section>; }
function Toggle({ name, label, description, defaultChecked }: { name: string; label: string; description: string; defaultChecked: boolean }) { return <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-border/50 bg-background/50 p-3"><input type="checkbox" name={name} defaultChecked={defaultChecked} className="mt-1" /><span><strong className="block text-xs">{label}</strong><span className="mt-1 block text-[10px] leading-4 text-muted-foreground">{description}</span></span></label>; }
