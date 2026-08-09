import Link from 'next/link';
import type { ReactNode } from 'react';
import { FolderKanban, Layers3, ShieldCheck } from 'lucide-react';

import {
  AdminMetric,
  AdminPage,
  AdminPageHeader,
  AdminPanel,
  adminFieldClass
} from '@/features/admin/components';
import { getVendorAccess } from '@/features/vendor/auth/vendorAccess';
import {
  archiveVendorRecord,
  MediaChoiceGrid,
  saveVendorCollection
} from '@/features/vendor/studios';
import { StudioProductPicker, StudioProductSummary, StudioSelectField } from '@/features/studio-controls';
import { resolveStudioProducts } from '@/features/studio-controls/server/resolveStudioProducts';
import { prisma } from '@/lib/prisma';

type VendorCollectionsPageProps = {
  searchParams: Promise<{ edit?: string }>;
};

function dateTimeLocal(value: Date | null | undefined): string {
  return value ? value.toISOString().slice(0, 16) : '';
}

export default async function VendorCollectionsPage({
  searchParams
}: VendorCollectionsPageProps) {
  const access = await getVendorAccess();

  if (!access.permissions.has('collection:view')) {
    throw new Error('Collection access is required.');
  }

  if (!access.studio.capabilities.collections) {
    throw new Error(
      `Collection Studio is not available on the ${access.studio.tier.toLowerCase()} Vendor Studio tier.`
    );
  }

  const { edit } = await searchParams;
  const [collections, products, media, editing] = await Promise.all([
    prisma.storeCollection.findMany({
      where: {
        workspaceId: access.workspace.id,
        vendorProfileId: access.vendor.id,
        status: { not: 'ARCHIVED' }
      },
      include: {
        coverMediaAsset: true,
        products: true
      },
      orderBy: { updatedAt: 'desc' }
    }),
    resolveStudioProducts({ workspaceId: access.workspace.id, vendorProfileId: access.vendor.id }),
    prisma.mediaAsset.findMany({
      where: {
        workspaceId: access.workspace.id,
        vendorProfileId: access.vendor.id,
        status: 'ACTIVE',
        resourceType: 'IMAGE'
      },
      orderBy: { createdAt: 'desc' },
      take: 100
    }),
    edit
      ? prisma.storeCollection.findFirst({
          where: {
            id: edit,
            workspaceId: access.workspace.id,
            vendorProfileId: access.vendor.id,
            status: { not: 'ARCHIVED' }
          },
          include: { products: true }
        })
      : null
  ]);

  const collectionLimit = access.studio.limits.collections;
  const hasCollectionCapacity =
    collectionLimit === null || collections.length < collectionLimit;
  const collectionQuota =
    collectionLimit === null
      ? `${collections.length} · Unlimited`
      : `${collections.length} / ${collectionLimit}`;

  return (
    <AdminPage>
      <div className="mx-auto max-w-[96rem] space-y-5">
        <AdminPageHeader
          eyebrow={`${access.vendor.name} · ${access.studio.tier} Studio`}
          title="Collection Studio"
          description="Assemble your published products into vendor-owned collections, then submit them to Waffi Market for approval."
        />

        <section className="grid gap-3 sm:grid-cols-3">
          <AdminMetric icon={FolderKanban} label="Collections" value={collectionQuota} />
          <AdminMetric
            icon={Layers3}
            label="Awaiting review"
            value={collections.filter(item => item.status === 'PENDING_REVIEW').length}
          />
          <AdminMetric
            icon={ShieldCheck}
            label="Published"
            value={collections.filter(item => item.status === 'PUBLISHED').length}
          />
        </section>

        {access.permissions.has('collection:manage') &&
        (editing || hasCollectionCapacity) ? (
          <AdminPanel
            title={editing ? `Edit ${editing.title}` : 'Create collection'}
            description="Only your active published products and your own Media Studio assets can be included.">
            <form action={saveVendorCollection} className="grid gap-4 lg:grid-cols-3">
              {editing ? <input type="hidden" name="id" value={editing.id} /> : null}

              <Field label="Title">
                <input
                  name="title"
                  defaultValue={editing?.title}
                  required
                  className={adminFieldClass}
                />
              </Field>

              <Field label="Slug">
                <input name="slug" defaultValue={editing?.slug} className={adminFieldClass} />
              </Field>

              <Field label="Layout">
                <StudioSelectField name="layout" defaultValue={editing?.layout ?? 'CAROUSEL'} options={[{ value: 'CAROUSEL', label: 'Carousel' }, { value: 'FEATURED', label: 'Featured' }, { value: 'GRID', label: 'Grid' }, { value: 'SPOTLIGHT', label: 'Spotlight' }]} />
              </Field>

              <Field label="Subtitle">
                <input
                  name="subtitle"
                  defaultValue={editing?.subtitle ?? ''}
                  className={adminFieldClass}
                />
              </Field>

              <Field label="Featured product">
                <StudioSelectField name="featuredProductId" defaultValue={editing?.featuredProductId ?? ''} options={[{ value: '', label: 'No featured product' }, ...products.map(product => ({ value: product.id, label: product.name }))]} />
              </Field>

              <Field label="Requested priority (0–10)">
                <input
                  name="priority"
                  type="number"
                  min="0"
                  max="10"
                  defaultValue={editing?.priority ?? 0}
                  className={adminFieldClass}
                />
              </Field>

              {access.studio.capabilities.scheduling ? (
                <>
                  <Field label="Starts">
                    <input
                      name="startsAt"
                      type="datetime-local"
                      defaultValue={dateTimeLocal(editing?.startsAt)}
                      className={adminFieldClass}
                    />
                  </Field>

                  <Field label="Ends">
                    <input
                      name="endsAt"
                      type="datetime-local"
                      defaultValue={dateTimeLocal(editing?.endsAt)}
                      className={adminFieldClass}
                    />
                  </Field>
                </>
              ) : null}

              <Field label="Description" className="lg:col-span-3">
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editing?.description ?? ''}
                  className={adminFieldClass}
                />
              </Field>

              <fieldset className="lg:col-span-3">
                <legend className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Cover gallery
                </legend>
                <MediaChoiceGrid
                  media={media}
                  name="coverMediaAssetId"
                  initialIds={editing?.coverMediaAssetId ? [editing.coverMediaAssetId] : []}
                  apiBasePath="/api/vendor/media"
                  purpose="collections"
                  uploadAccept="image"
                  acceptedResourceTypes={['IMAGE']}
                />
              </fieldset>

              <fieldset className="lg:col-span-3">
                <legend className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Collection products
                </legend>
                <StudioProductPicker
                  products={products}
                  initialIds={editing?.products.map(item => item.productId) ?? []}
                  description="Choose from your published products. Images, stock and product status remain visible during selection."
                />
              </fieldset>

              <div className="flex flex-wrap gap-3 lg:col-span-3">
                <button
                  name="intent"
                  value="draft"
                  className="h-11 rounded-full border border-border px-5 text-xs font-bold">
                  Save draft
                </button>
                <button
                  name="intent"
                  value="submit"
                  className="h-11 rounded-full bg-foreground px-5 text-xs font-bold text-background">
                  Submit for approval
                </button>
                {editing ? (
                  <Link
                    href="/vendor/collections"
                    className="h-11 rounded-full px-5 text-xs font-bold leading-[2.75rem] text-muted-foreground">
                    Cancel editing
                  </Link>
                ) : null}
              </div>
            </form>
          </AdminPanel>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {collections.map(collection => (
            <article
              key={collection.id}
              className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/75">
              <div className="aspect-[16/8] bg-muted">
                {collection.coverMediaAsset ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={collection.coverMediaAsset.secureUrl}
                    alt={collection.title}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="grid size-full place-items-center">
                    <FolderKanban className="size-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="p-5">
                <span className="rounded-full bg-muted px-2 py-1 text-[8px] font-black">
                  {collection.status.replaceAll('_', ' ')}
                </span>
                <h2 className="mt-3 text-lg font-black">{collection.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {collection.products.length} products · {collection.layout.toLowerCase()}
                </p>
                <StudioProductSummary products={products.filter(product => collection.products.some(item => item.productId === product.id))} className="mt-4" />
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/vendor/collections?edit=${collection.id}`}
                    className="rounded-full bg-foreground px-3 py-2 text-[9px] font-bold text-background">
                    Edit
                  </Link>
                  <form action={archiveVendorRecord.bind(null, 'collection')}>
                    <input type="hidden" name="id" value={collection.id} />
                    <button className="rounded-full border border-border px-3 py-2 text-[9px] font-bold">
                      Archive
                    </button>
                  </form>
                </div>
              </div>
            </article>
          ))}
        </section>
      </div>
    </AdminPage>
  );
}

function Field({
  label,
  children,
  className = ''
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <label className={className}>
      <span className="mb-2 block text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {label}
      </span>
      {children}
    </label>
  );
}
