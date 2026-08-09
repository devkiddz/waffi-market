import Link from 'next/link';
import type { ReactNode } from 'react';
import { BadgePercent, Clock3, ShieldCheck } from 'lucide-react';

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
  saveVendorPromotion
} from '@/features/vendor/studios';
import { StudioProductPicker, StudioProductSummary, StudioSelectField } from '@/features/studio-controls';
import { resolveStudioProducts } from '@/features/studio-controls/server/resolveStudioProducts';
import { prisma } from '@/lib/prisma';

type VendorPromotionsPageProps = {
  searchParams: Promise<{ edit?: string }>;
};

function dateTimeLocal(value: Date | null | undefined): string {
  return value ? value.toISOString().slice(0, 16) : '';
}

export default async function VendorPromotionsPage({
  searchParams
}: VendorPromotionsPageProps) {
  const access = await getVendorAccess();

  if (!access.permissions.has('promotion:view')) {
    throw new Error('Promotion access is required.');
  }

  if (!access.studio.capabilities.promotions) {
    throw new Error(
      `Promotion Studio is not available on the ${access.studio.tier.toLowerCase()} Vendor Studio tier.`
    );
  }

  const { edit } = await searchParams;
  const [promotions, products, media, editing] = await Promise.all([
    prisma.promotion.findMany({
      where: {
        workspaceId: access.workspace.id,
        vendorProfileId: access.vendor.id,
        status: { not: 'ARCHIVED' }
      },
      include: {
        bannerMediaAsset: true,
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
      ? prisma.promotion.findFirst({
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

  const promotionLimit = access.studio.limits.promotions;
  const hasPromotionCapacity =
    promotionLimit === null || promotions.length < promotionLimit;
  const promotionQuota =
    promotionLimit === null
      ? `${promotions.length} · Unlimited`
      : `${promotions.length} / ${promotionLimit}`;

  return (
    <AdminPage>
      <div className="mx-auto max-w-[96rem] space-y-5">
        <AdminPageHeader
          eyebrow={`${access.vendor.name} · ${access.studio.tier} Studio`}
          title="Promotion Studio"
          description="Design controlled offers for your published products. Waffi Market approval is required before public activation."
        />

        <section className="grid gap-3 sm:grid-cols-3">
          <AdminMetric icon={BadgePercent} label="Promotions" value={promotionQuota} />
          <AdminMetric
            icon={Clock3}
            label="Awaiting review"
            value={promotions.filter(item => item.status === 'PENDING_REVIEW').length}
          />
          <AdminMetric
            icon={ShieldCheck}
            label="Published"
            value={promotions.filter(item => item.status === 'PUBLISHED').length}
          />
        </section>

        {access.permissions.has('promotion:manage') &&
        (editing || hasPromotionCapacity) ? (
          <AdminPanel
            title={editing ? `Edit ${editing.title}` : 'Create promotion'}
            description="Only your active published products and your own Media Studio assets can be submitted.">
            <form action={saveVendorPromotion} className="grid gap-4 lg:grid-cols-3">
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

              <Field label="Offer type">
                <StudioSelectField name="type" defaultValue={editing?.type ?? 'PERCENTAGE'} options={[{ value: 'PERCENTAGE', label: 'Percentage discount' }, { value: 'FIXED_AMOUNT', label: 'Fixed amount' }, { value: 'FIXED_PRICE', label: 'Fixed price' }, { value: 'FEATURED', label: 'Featured placement' }]} />
              </Field>

              <Field label="Discount value">
                <input
                  name="discountValue"
                  type="number"
                  min="0"
                  step="0.01"
                  defaultValue={
                    editing?.discountValue === null
                      ? ''
                      : Number(editing?.discountValue ?? 0)
                  }
                  className={adminFieldClass}
                />
              </Field>

              <Field label="Code">
                <input
                  name="code"
                  defaultValue={editing?.code ?? ''}
                  className={adminFieldClass}
                />
              </Field>

              <Field label="Usage limit">
                <input
                  name="usageLimit"
                  type="number"
                  min="1"
                  defaultValue={editing?.usageLimit ?? ''}
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
                  Banner gallery
                </legend>
                <MediaChoiceGrid
                  media={media}
                  name="bannerMediaAssetId"
                  initialIds={editing?.bannerMediaAssetId ? [editing.bannerMediaAssetId] : []}
                  apiBasePath="/api/vendor/media"
                  purpose="promotions"
                  uploadAccept="image"
                  acceptedResourceTypes={['IMAGE']}
                />
              </fieldset>

              <fieldset className="lg:col-span-3">
                <legend className="mb-2 text-[9px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Eligible products
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
                    href="/vendor/promotions"
                    className="h-11 rounded-full px-5 text-xs font-bold leading-[2.75rem] text-muted-foreground">
                    Cancel editing
                  </Link>
                ) : null}
              </div>
            </form>
          </AdminPanel>
        ) : null}

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {promotions.map(promotion => (
            <article
              key={promotion.id}
              className="overflow-hidden rounded-[2rem] border border-border/60 bg-card/75">
              <div className="aspect-[16/8] bg-muted">
                {promotion.bannerMediaAsset ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={promotion.bannerMediaAsset.secureUrl}
                    alt={promotion.title}
                    className="size-full object-cover"
                  />
                ) : (
                  <div className="grid size-full place-items-center">
                    <BadgePercent className="size-8 text-muted-foreground" />
                  </div>
                )}
              </div>

              <div className="p-5">
                <span className="rounded-full bg-muted px-2 py-1 text-[8px] font-black">
                  {promotion.status.replaceAll('_', ' ')}
                </span>
                <h2 className="mt-3 text-lg font-black">{promotion.title}</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  {promotion.products.length} products ·{' '}
                  {promotion.type.replaceAll('_', ' ').toLowerCase()}
                </p>
                <StudioProductSummary products={products.filter(product => promotion.products.some(item => item.productId === product.id))} className="mt-4" />
                <div className="mt-4 flex gap-2">
                  <Link
                    href={`/vendor/promotions?edit=${promotion.id}`}
                    className="rounded-full bg-foreground px-3 py-2 text-[9px] font-bold text-background">
                    Edit
                  </Link>
                  <form action={archiveVendorRecord.bind(null, 'promotion')}>
                    <input type="hidden" name="id" value={promotion.id} />
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
